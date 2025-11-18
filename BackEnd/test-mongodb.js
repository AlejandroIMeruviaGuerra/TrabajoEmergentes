#!/usr/bin/env node
/**
 * Script para verificar conexión a MongoDB y ver qué datos hay
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function testMongoDB() {
  console.log("🔍 Probando conexión a MongoDB Atlas...");

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ Conexión exitosa a MongoDB Atlas");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📋 Colecciones en la BD:");
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Contar documentos en air_quality
    const airQualityModel = mongoose.model("AirQuality", {}, "air_quality");
    const airCount = await airQualityModel.countDocuments();
    console.log(`\n📊 Documentos en air_quality: ${airCount}`);

    // Ver últimos 3 registros
    const airData = await airQualityModel.find().sort({ time: -1 }).limit(3).lean();
    console.log("\n📌 Últimos 3 documentos de air_quality:");
    airData.forEach((doc, i) => {
      console.log(`\n  Documento ${i + 1}:`);
      console.log(`    ID: ${doc._id}`);
      console.log(`    Time: ${doc.time}`);
      console.log(`    DevEui: ${doc.devEui}`);
      console.log(`    CO2: ${doc.co2}, Temp: ${doc.temperature}, Humidity: ${doc.humidity}`);
    });

    // Contar noise y underground también
    const noiseModel = mongoose.model("Noise", {}, "noise");
    const undergroundModel = mongoose.model("Underground", {}, "underground");

    const noiseCount = await noiseModel.countDocuments();
    const undergroundCount = await undergroundModel.countDocuments();

    console.log(`\n📊 Otros conteos:`);
    console.log(`    noise: ${noiseCount} documentos`);
    console.log(`    underground: ${undergroundCount} documentos`);

    await mongoose.disconnect();
    console.log("\n✅ Desconectado correctamente de MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testMongoDB();
