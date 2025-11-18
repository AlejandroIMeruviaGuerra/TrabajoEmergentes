#!/usr/bin/env node
/**
 * Script para verificar conexión a MySQL y ver qué datos hay
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testMySQL() {
  console.log("🔍 Probando conexión a MySQL...");
  console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`Base de datos: ${process.env.DB_NAME}`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log("✅ Conexión exitosa a MySQL");

    // Verificar tablas
    const [tables] = await connection.execute("SHOW TABLES;");
    console.log("\n📋 Tablas en la BD:");
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

    // Contar registros en air_quality
    const [airCount] = await connection.execute("SELECT COUNT(*) as count FROM air_quality;");
    console.log(`\n📊 Registros en air_quality: ${airCount[0].count}`);

    // Ver últimos 3 registros de air_quality
    const [airData] = await connection.execute(
      "SELECT id, time, devEui, co2, temperature, humidity FROM air_quality ORDER BY time DESC LIMIT 3;"
    );
    console.log("\n📌 Últimos 3 registros de air_quality:");
    airData.forEach(row => {
      console.log(`  ID: ${row.id}`);
      console.log(`  Time: ${row.time}`);
      console.log(`  DevEui: ${row.devEui}`);
      console.log(`  CO2: ${row.co2}, Temp: ${row.temperature}, Humidity: ${row.humidity}`);
      console.log("");
    });

    await connection.end();
    console.log("✅ Desconectado correctamente");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testMySQL();
