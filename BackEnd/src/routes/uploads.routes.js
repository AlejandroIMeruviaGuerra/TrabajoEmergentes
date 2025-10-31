// src/routes/uploads.routes.js
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { parse } from "fast-csv";
import { verifyToken } from "../middlewares/auth.js";
import { ingestRecord } from "../services/ingest.service.js";

const router = Router();
const upload = multer({ dest: path.join(process.cwd(), "tmp") });

// ---- Detección de tipo por columnas ----
function detectType(headers = [], fallback) {
  const H = headers.map(h => h.toLowerCase().trim());
  if (H.includes("laeq") || H.includes("laimax") || H.includes("lai")) return "noise";
  if (H.includes("distance")) return "underground";
  if (H.includes("co2") || H.includes("humidity") || H.includes("temperature") || H.includes("pressure")) return "air";
  return ["air", "noise", "underground"].includes(fallback) ? fallback : "air";
}

// ---- Normalizador de fecha -> Date ----
function toDate(v) {
  if (v === undefined || v === null || v === "") return new Date();
  const n = Number(v);
  if (!Number.isNaN(n)) {
    // si parece timestamp en segundos -> a ms
    const ms = n < 1e12 ? n * 1000 : n;
    return new Date(ms);
  }
  const t = new Date(v);
  return isNaN(t.getTime()) ? new Date() : t;
}

// ---- Mapeos mínimos a tu payload (lo que espera ingestRecord) ----
function mapRowToPayload(type, row) {
  const id = row.id ?? undefined;
  const time = toDate(row.time ?? row.t ?? row.timestamp);

  if (type === "noise") {
    return {
      id,
      time,
      device: { devEui: row.devEui ?? row.deveui, name: row.device_name, profile: row.device_profile },
      location: { lat: Number(row.lat) || null, lng: Number(row.lng) || null, address: row.address },
      radio: { sf: row.sf ? Number(row.sf) : null, bw: row.bw ? Number(row.bw) : null, dr: row.dr ? Number(row.dr) : null },
      measures: { laeq: row.laeq ? Number(row.laeq) : null, lai: row.lai ? Number(row.lai) : null, laimax: row.laimax ? Number(row.laimax) : null },
      battery: row.battery ? Number(row.battery) : null,
      status: row.status || null
    };
  }

  if (type === "underground") {
    return {
      id,
      time,
      device: { devEui: row.devEui ?? row.deveui, name: row.device_name, profile: row.device_profile },
      location: { lat: Number(row.lat) || null, lng: Number(row.lng) || null, address: row.address },
      radio: { sf: row.sf ? Number(row.sf) : null, bw: row.bw ? Number(row.bw) : null, dr: row.dr ? Number(row.dr) : null },
      measures: { distance: row.distance ? Number(row.distance) : null, unit: row.unit || null },
      battery: row.battery ? Number(row.battery) : null,
      status: row.status || null
    };
  }

  // default: air
  return {
    id,
    time,
    device: {
      devEui: row.devEui ?? row.deveui,
      name: row.device_name,
      profile: row.device_profile,
      tenant: row.tenant,
      application: row.application,
    },
    location: { lat: Number(row.lat) || null, lng: Number(row.lng) || null, address: row.address },
    radio: { sf: row.sf ? Number(row.sf) : null, bw: row.bw ? Number(row.bw) : null, dr: row.dr ? Number(row.dr) : null },
    measures: {
      co2: row.co2 ? Number(row.co2) : null,
      temperature: row.temperature ? Number(row.temperature) : null,
      humidity: row.humidity ? Number(row.humidity) : null,
      pressure: row.pressure ? Number(row.pressure) : null,
    },
    labels: {
      co2_status: row.co2_status || null,
      co2_message: row.co2_message || null,
      temperature_message: row.temperature_message || null,
      humidity_message: row.humidity_message || null,
      pressure_status: row.pressure_status || null,
    },
  };
}

// POST /api/uploads/csv (multi-archivo)
// Acepta: form-data con files[] (varios), y opcional: type=air|noise|underground
router.post("/csv", verifyToken, upload.array("files", 20), async (req, res) => {
  try {
    const fallbackType = (req.body.type || "").toLowerCase();
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: "Sube uno o más CSV en campo 'files'." });

    const results = [];

    // Procesa cada archivo en serie (podrías paralelizar si quieres)
    for (const file of files) {
      const filePath = file.path;
      let detectedType = fallbackType;
      let inserted = 0;
      let headers = null;

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(parse({ headers: true, ignoreEmpty: true, trim: true }))
          .on("error", reject)
          .on("headers", (h) => { headers = h; })
          .on("data", async (row) => {
            try {
              if (!detectedType) detectedType = detectType(headers, fallbackType);
              const payload = mapRowToPayload(detectedType, row);
              await ingestRecord(detectedType, payload); // usa tu service (Mongo + MySQL + socket)
              inserted++;
            } catch (e) {
              // puedes acumular errores por fila si te interesa
              // console.warn("Fila con error:", e.message);
            }
          })
          .on("end", resolve);
      });

      try { fs.unlinkSync(filePath); } catch {}

      results.push({ filename: file.originalname, type: detectedType || "air", inserted });
    }

    return res.json({ ok: true, results });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

export default router;
