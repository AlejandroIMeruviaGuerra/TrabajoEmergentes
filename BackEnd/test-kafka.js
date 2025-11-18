#!/usr/bin/env node
/**
 * Script para probar el flujo completo:
 * 1. Verificar conexión a Kafka
 * 2. Consumir mensajes sin procesar
 * 3. Mostrar qué hay en los topics
 */

import { Kafka, logLevel } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

async function inspectKafka() {
  console.log("🔍 Inspeccionando Kafka...");
  const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  console.log(`Brokers: ${brokers.join(", ")}`);

  const kafka = new Kafka({
    clientId: "inspector",
    brokers,
    logLevel: logLevel.ERROR,
    retry: { initialRetryTime: 300, retries: 5 },
  });

  const admin = kafka.admin();
  await admin.connect();
  console.log("✅ Conectado a Kafka admin");

  try {
    // Listar topics
    const topics = await admin.listTopics();
    console.log("\n📋 Topics en Kafka:");
    topics.forEach(t => console.log(`  - ${t}`));

    // Describir offsets de sensores.*
    const sensorTopics = topics.filter(t => t.startsWith("sensores"));
    if (sensorTopics.length > 0) {
      console.log("\n📊 Mensajes por topic:");
      
      for (const topic of sensorTopics) {
        const offsets = await admin.fetchOffsets({ topic });
        const totalMessages = offsets.reduce((sum, offset) => {
          return sum + (parseInt(offset.high, 10) - parseInt(offset.low, 10));
        }, 0);
        console.log(`  ${topic}: ~${totalMessages} mensajes`);
      }
    }

    await admin.disconnect();
    console.log("\n✅ Desconectado de Kafka");

  } catch (error) {
    console.error("❌ Error:", error.message);
    await admin.disconnect();
    process.exit(1);
  }
}

inspectKafka();
