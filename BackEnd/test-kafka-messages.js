#!/usr/bin/env node
// BackEnd/test-kafka-messages.js
// Verifica qué datos EXACTOS llegan a Kafka

import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "test-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "test-group-" + Date.now() });

async function start() {
  await consumer.connect();
  
  // Subscribir a los tópicos de prueba
  await consumer.subscribe({ topic: "sensores.air", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.noise", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.underground", fromBeginning: false });

  console.log("Escuchando Kafka...\n");
  let messageCount = 0;

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      messageCount++;
      const payload = JSON.parse(message.value.toString());
      
      console.log(`\n📨 Mensaje #${messageCount} - Tópico: ${topic}`);
      console.log("━".repeat(80));
      console.log(JSON.stringify(payload, null, 2));
      console.log("━".repeat(80));

      // Después de capturar 3 mensajes, salir
      if (messageCount >= 3) {
        console.log("\n✅ Capturados 3 mensajes de ejemplo. Saliendo...");
        await consumer.disconnect();
        process.exit(0);
      }
    },
  });

  // Timeout de 60 segundos
  setTimeout(async () => {
    console.log("\n⏱️  Timeout de 60 segundos alcanzado");
    await consumer.disconnect();
    process.exit(1);
  }, 60000);
}

start().catch(console.error);
