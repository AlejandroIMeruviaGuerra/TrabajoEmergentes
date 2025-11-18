#!/usr/bin/env node
/**
 * Script para simular carga de CSV y ver los NUEVOS mensajes en Kafka
 */

import fs from "fs";
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
    // 1) Preparar consumer ANTES de ejecutar ingestor
    console.log("\n1️⃣ Preparando Kafka consumer...");
    const { Kafka, logLevel } = await import("kafkajs");
    const dotenv = await import("dotenv");
    dotenv.default.config();

    const kafka = new Kafka({
      clientId: "verifier-" + Date.now(),
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
      logLevel: logLevel.ERROR,
    });

    const consumer = kafka.consumer({ groupId: "test-verifier-" + Date.now() });
    await consumer.connect();
    await consumer.subscribe({ topic: "sensores.air", fromBeginning: false });
    console.log("✅ Consumer subscrito");

    let newMessagesCount = 0;
    
    // Iniciar el consumer ANTES de enviar datos
    const consumerPromise = consumer.run({
      eachMessage: async ({ topic, message }) => {
        newMessagesCount++;
        if (newMessagesCount <= 2) {
          const msg = JSON.parse(message.value.toString());
          console.log(`\n📨 Nuevo mensaje ${newMessagesCount}:`);
          console.log(`   Type: ${msg.type}, ID: ${msg.id}`);
          console.log(`   Measures: ${JSON.stringify(msg.measures)}`);
        }
      },
    });

    // 2) Ejecutar Java ingestor DESPUÉS de que consumer esté escuchando
    console.log("\n2️⃣ Ejecutando Java Ingestor...");
    await triggerIngestor(type, csvPath);
    console.log("✅ Java Ingestor completado");

    // 3) Esperar para capturar mensajes
    console.log("\n3️⃣ Esperando 5 segundos para capturar mensajes...");
    await new Promise(r => setTimeout(r, 5000));

    // Desconectar
    await consumer.disconnect();
    console.log(`\n✅ Nuevos mensajes capturados: ${newMessagesCount}`);
    
    if (newMessagesCount > 0) {
      console.log("✨ ¡Flujo exitoso! Los datos están en Kafka");
    } else {
      console.log("⚠️ No hay nuevos mensajes en Kafka");
    }
    
    process.exit(0);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testFlow();
