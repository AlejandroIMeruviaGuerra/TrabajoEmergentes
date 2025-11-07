// src/services/upload.service.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { Kafka, Partitioners, logLevel } from "kafkajs";
import csv from "fast-csv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const CHUNK_SIZE = (parseInt(process.env.CHUNK_SIZE_MB || "5", 10)) * 1024 * 1024;

// Asegura carpeta
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---- Estado simple in-memory (id -> meta) ----
const sessions = new Map();
// id simple
const newId = () => crypto.randomBytes(16).toString("hex");

// ---- Init de subida ----
export function initUpload({ filename, size, type }) {
  const id = newId();
  const parts = Math.ceil(size / CHUNK_SIZE);
  const folder = path.join(UPLOAD_DIR, id);
  fs.mkdirSync(folder, { recursive: true });

  sessions.set(id, {
    id, filename, size, type,
    partsExpected: parts,
    received: new Set(), // part indexes
    folder,
    assembledPath: null,
  });

  return { id, chunkSize: CHUNK_SIZE, parts };
}

// ---- Escritura de chunk (binario) ----
export async function writeChunk(id, partIndex, buffer) {
  const s = sessions.get(id);
  if (!s) throw new Error("Upload session not found");

  // Validación simple de tamaño (opcional)
  // if (buffer.length > CHUNK_SIZE) throw new Error("Chunk too large");

  const partName = String(partIndex).padStart(6, "0");
  const tmpPath = path.join(s.folder, `${partName}.part`);
  await fs.promises.writeFile(tmpPath, buffer);
  s.received.add(partIndex);

  return { received: s.received.size, partsExpected: s.partsExpected };
}

// ---- Estado (para resume en front) ----
export function statusUpload(id) {
  const s = sessions.get(id);
  if (!s) throw new Error("Upload session not found");
  return {
    id: s.id,
    received: [...s.received].sort((a, b) => a - b),
    partsExpected: s.partsExpected,
    filename: s.filename,
    type: s.type,
  };
}

// ---- Ensamblar y disparar ingesta CSV->Kafka ----
export async function completeUpload(id, io) {
  const s = sessions.get(id);
  if (!s) throw new Error("Upload session not found");

  if (s.received.size !== s.partsExpected) {
    throw new Error(`Faltan partes: ${s.partsExpected - s.received.size}`);
  }

  const outPath = path.join(s.folder, s.filename);
  const out = fs.createWriteStream(outPath);

  for (let i = 0; i < s.partsExpected; i++) {
    const partName = String(i).padStart(6, "0");
    const partPath = path.join(s.folder, `${partName}.part`);
    await new Promise((res, rej) => {
      const r = fs.createReadStream(partPath);
      r.on("error", rej);
      r.on("end", res);
      r.pipe(out, { end: false });
    });
  }

  await new Promise((res) => out.end(res));
  s.assembledPath = outPath;

  // Limpia partes (opcional)
  for (let i = 0; i < s.partsExpected; i++) {
    const partName = String(i).padStart(6, "0");
    const partPath = path.join(s.folder, `${partName}.part`);
    fs.existsSync(partPath) && fs.unlinkSync(partPath);
  }

  // Emite evento de ensamblado
  io?.emit("upload:completed", { id: s.id, filename: s.filename, type: s.type });

  // Dispara ingesta hacia Kafka
  const stats = await publishCsvToKafka(s.assembledPath, s.type, (progress) => {
    // feedback tiempo real
    io?.emit("ingest:progress", { id: s.id, ...progress });
  });

  return { id: s.id, output: s.assembledPath, stats };
}

// ---- Publicación CSV -> Kafka por filas ----
async function publishCsvToKafka(csvPath, type, onProgress) {
  const topicMap = {
    air: "sensores.air",
    noise: "sensores.noise",
    underground: "sensores.underground",
  };
  const topic = topicMap[type];
  if (!topic) throw new Error(`Tipo inválido: ${type}`);

  const brokers = (process.env.KAFKA_BROKERS || "host.docker.internal:9092")
    .split(",")
    .map(s => s.trim());

  const kafka = new Kafka({
    clientId: "csv-uploader",
    brokers,
    logLevel: logLevel.WARN,
  });

  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner // silencia warning v2
  });

  await producer.connect();

  let sent = 0;
  let batch = [];
  let totalEstimated = 0; // si quisieras estimar con un pre-scan

  const stream = fs.createReadStream(csvPath);
  const parser = csv.parse({ headers: true, ignoreEmpty: true, trim: true });

  const flush = async () => {
    if (batch.length === 0) return;
    await producer.send({ topic, messages: batch });
    sent += batch.length;
    onProgress?.({ phase: "sending", sent, lastBatch: batch.length });
    batch = [];
  };

  return new Promise((resolve, reject) => {
    parser.on("error", async (err) => {
      try { await producer.disconnect(); } catch {}
      reject(err);
    });

    parser.on("data", async (row) => {
      // row es un objeto con columnas -> normaliza si quieres
      // Publica tal cual JSON (tu consumer ya sabe normalizar en ingest.service)
      batch.push({ value: JSON.stringify(row) });
      if (batch.length >= 500) {
        parser.pause();
        flush().then(() => parser.resume()).catch(reject);
      }
    });

    parser.on("end", async () => {
      try {
        await flush();
        await producer.disconnect();
        resolve({ totalSent: sent, topic });
      } catch (e) {
        reject(e);
      }
    });

    stream.pipe(parser);
  });
}
