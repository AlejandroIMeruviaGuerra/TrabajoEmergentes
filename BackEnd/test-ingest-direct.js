/**
 * Script de prueba directa de ingesta
 * Úsalo para verificar que MongoDB y MySQL funcionan correctamente
 */

import { ingestRecord } from "./src/services/ingest.service.js";
import { connectMongo } from "./src/config/db_mongo.js";
import { connectMySQL } from "./src/config/db_mysql.js";
import dotenv from "dotenv";

dotenv.config();

// Inicializar conexiones
await connectMongo();
await connectMySQL();

console.log("✅ Conexiones establecidas");

// Datos de prueba
const testAirData = {
  devEui: "eui-0000000000000001",
  time: new Date("2025-11-17T10:00:00Z"),
  temperature: 22.5,
  humidity: 65,
  co2: 450,
  voc: 120,
  locationName: "TEST-LOCATION"
};

console.log("📤 Insertando dato de prueba:", testAirData);

try {
  await ingestRecord("air", testAirData);
  console.log("✅ Dato insertado correctamente");
  
  // Esperar un poco para que se guarde
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("✅ Prueba completada - verifica MongoDB y MySQL");
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
