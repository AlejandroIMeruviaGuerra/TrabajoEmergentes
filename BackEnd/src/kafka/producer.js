import { Kafka } from "kafkajs";
const kafka = new Kafka({ clientId: "emergentes-producer", brokers: ["localhost:9092"] });
const producer = kafka.producer();

export async function sendMockData() {
  await producer.connect();
  console.log("✅ Kafka producer conectado");

  const tipos = ["air", "noise", "underground"];
  setInterval(async () => {
    const type = tipos[Math.floor(Math.random() * tipos.length)];
    const payload = {
      sensorId: "S" + Math.floor(Math.random() * 100),
      location: "Zona Norte",
      pm25: Math.random() * 100,
      pm10: Math.random() * 150,
      co2: Math.random() * 2000,
      decibels: Math.random() * 90,
      humidity: Math.random() * 80,
      temperature: Math.random() * 40,
    };
    await producer.send({
      topic: "sensores",
      messages: [{ key: type, value: JSON.stringify(payload) }],
    });
    console.log(`📡 Enviado: ${type}`);
  }, 5000);
}
