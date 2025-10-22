// src/kafka/consumer.js
import { Kafka, logLevel } from "kafkajs";
import { ingestRecord, setIO as setIOIngest } from "../services/ingest.service.js";

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

  consumer = kafka.consumer({ groupId: "grupo-sensores", sessionTimeout: 30000 });

  await consumer.connect();
  await consumer.subscribe({ topic: "sensores.air", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.noise", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.underground", fromBeginning: false });

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
