#!/usr/bin/env node
/**
 * Script para leer mensajes de un topic de Kafka
 */

import { Kafka, logLevel } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

async function readKafkaTopic() {
  console.log("🔍 Leyendo mensajes de Kafka...");
  const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

  const kafka = new Kafka({
    clientId: "reader",
    brokers,
    logLevel: logLevel.ERROR,
  });

  const consumer = kafka.consumer({ groupId: "test-reader" });
  await consumer.connect();
  console.log("✅ Conectado a Kafka");

  await consumer.subscribe({ topic: "sensores.air", fromBeginning: true });

  let messageCount = 0;
  let shown = 0;
  const MAX_SHOW = 3;

  const timeout = setTimeout(async () => {
    await consumer.disconnect();
    console.log(`\n✅ Total mensajes encontrados en sensores.air: ${messageCount}`);
    process.exit(0);
  }, 5000);

  await consumer.run({
    eachMessage: async ({ topic, message, partition }) => {
      messageCount++;
      if (shown < MAX_SHOW) {
        console.log(`\n📨 Mensaje ${messageCount}:`);
        console.log(`  Partition: ${partition}`);
        console.log(`  Value: ${message.value.toString()}`);
        shown++;
      }
    },
  });
}

readKafkaTopic();
