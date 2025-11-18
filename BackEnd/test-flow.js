#!/usr/bin/env node
/**
 * Script para simular carga de CSV y ver qué pasa
 */

import fs from "fs";
import path from "path";
import { triggerIngestor } from "./src/workers/ingest-trigger.js";

async function testFlow() {
  const csvPath = "D:/lunes/TrabajoEmergentes/test-simple.csv";
  const type = "air";

  console.log("🧪 Iniciando prueba de flujo...");
  console.log(`📂 CSV: ${csvPath}`);
  console.log(`📊 Tipo: ${type}`);

  if (!fs.existsSync(csvPath)) {
    console.error("❌ Archivo no existe");
    process.exit(1);
  }

  try {
    // 1) Ejecutar Java ingestor
    console.log("\n1️⃣ Ejecutando Java Ingestor...");
    await triggerIngestor(type, csvPath);
    console.log("✅ Java Ingestor completado");

    // 2) Esperar un poco para que Kafka procese
    console.log("\n2️⃣ Esperando 3 segundos para que Kafka procese...");
    await new Promise(r => setTimeout(r, 3000));

    // 3) Leer de Kafka para verificar
    console.log("\n3️⃣ Verificando mensajes en Kafka...");
    const { Kafka, logLevel } = await import("kafkajs");
    const dotenv = await import("dotenv");
    dotenv.default.config();

    const kafka = new Kafka({
      clientId: "verifier",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
      logLevel: logLevel.ERROR,
    });

    const consumer = kafka.consumer({ groupId: "test-verifier-" + Date.now() });
    await consumer.connect();

    let messageCount = 0;
    let newMessagesCount = 0;
    const timeout = setTimeout(async () => {
      await consumer.disconnect();
      console.log(`\n✅ Total de mensajes en sensores.air: ${messageCount}`);
      console.log(`✅ Nuevos mensajes capturados: ${newMessagesCount}`);
      
      if (newMessagesCount > 0) {
        console.log("✨ ¡Flujo exitoso! Los datos están en Kafka");
      } else {
        console.log("⚠️ No hay nuevos mensajes en Kafka - revisar Java ingestor");
      }
      
      process.exit(0);
    }, 5000);

    await consumer.subscribe({ topic: "sensores.air", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        newMessagesCount++;
        if (newMessagesCount <= 2) {
          console.log(`\n📨 Nuevo mensaje ${newMessagesCount}: ${message.value.toString()}`);
        }
      },
    });

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testFlow();
