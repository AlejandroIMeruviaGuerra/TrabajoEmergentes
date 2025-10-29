// src/kafka/consumer.js
import { Kafka, logLevel } from "kafkajs";
import { ingestRecord, setIO as setIOIngest } from "../services/ingest.service.js";

// CAMBIO 1: KAFKA_BROKERS por defecto
// ANTES: const BROKERS = (process.env.KAFKA_BROKERS || "host.docker.internal:9092").split(",");
// DESPUÉS: Se cambió en .env a localhost:9092 para Windows
// RAZÓN: host.docker.internal no es accesible desde aplicaciones Windows host
const BROKERS = (process.env.KAFKA_BROKERS || "host.docker.internal:9092").split(",");

let kafka = null;
let consumer = null;

export function setSocketIO(io) { setIOIngest(io); }

export async function startConsumer() {
  kafka = new Kafka({
    clientId: "emergentes-consumer",
    brokers: BROKERS,
    logLevel: logLevel.ERROR,
    retry: {
      initialRetryTime: 300, // ms
      retries: 10,
    },
  });

  consumer = kafka.consumer({ 
    groupId: "grupo-sensores", 
    sessionTimeout: 30000,
  });

  // CAMBIO 2: Eliminado intento de registrar codec Snappy
  // ANTES: Se intentaba registrar SnappyCodec en el evento CONNECT
  // consumer.on(consumer.events.CONNECT, async () => {
  //   await consumer.addCodec('snappy', SnappyCodec);
  // });
  // DESPUÉS: Eliminado completamente
  // RAZÓN: El productor Java ya no usa compresión Snappy (se cambió a "none")

  await consumer.connect();
  
  // CAMBIO 3: fromBeginning cambiado a true
  // ANTES: fromBeginning: false
  // DESPUÉS: fromBeginning: true
  // RAZÓN: Para procesar todos los mensajes desde el inicio del topic
  await consumer.subscribe({ topic: "sensores.air", fromBeginning: true });
  await consumer.subscribe({ topic: "sensores.noise", fromBeginning: true });
  await consumer.subscribe({ topic: "sensores.underground", fromBeginning: true });

  console.log("✅ Kafka consumer conectado y escuchando topics sensores.*");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const type = topic.split(".")[1]; // 'air' | 'noise' | 'underground'
        await ingestRecord(type, payload);
      } catch (e) {
        console.error("❌ Kafka eachMessage:", e.message);
      }
    },
  });
}
