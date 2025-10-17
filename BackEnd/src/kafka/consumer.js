// src/kafka/consumer.js
import { Kafka } from "kafkajs";
import { registerSensorData } from "../controllers/sensors.controller.js";

const kafka = new Kafka({
  clientId: "emergentes-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "grupo-sensores" });

// io se inyectará desde index.js
let ioInstance = null;
export function setSocketIO(io) {
  ioInstance = io;
}

export async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "sensores", fromBeginning: true });
  console.log("✅ Kafka consumer conectado y escuchando topic 'sensores'");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const type = message.key.toString();
        const value = JSON.parse(message.value.toString());

        // Simula guardado usando el controlador existente
        await registerSensorData({ params: { type }, body: value }, {
          json: () => {}, // respuesta vacía para simular
          status: () => ({ json: () => {} }),
        });

        // Emitir al frontend vía WebSocket
        if (ioInstance) {
          ioInstance.emit("new-sensor-data", { type, value });
          console.log(`📡 Dato emitido a frontend (${type}):`, value);
        }
      } catch (error) {
        console.error("❌ Error al procesar mensaje Kafka:", error.message);
      }
    },
  });
}
