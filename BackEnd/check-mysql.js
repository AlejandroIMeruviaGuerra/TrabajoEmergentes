#!/usr/bin/env node
// BackEnd/check-mysql.js
// Verifica qué datos están en MySQL

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    // 1. Contar registros
    const [countAir] = await conn.query("SELECT COUNT(*) as count FROM air_quality");
    console.log("\n📊 Air Quality Registros:", countAir[0].count);

    // 2. Obtener últimos 3 registros
    const [latestAir] = await conn.query(`
      SELECT id, devEui, time, co2, temperature, humidity, address 
      FROM air_quality 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    console.log("\n🔍 Últimos 3 registros en MySQL:\n");
    latestAir.forEach((row, i) => {
      console.log(`${i + 1}. ID: ${row.id}`);
      console.log(`   devEui: ${row.devEui}`);
      console.log(`   time: ${row.time}`);
      console.log(`   co2: ${row.co2}`);
      console.log(`   temperature: ${row.temperature}`);
      console.log(`   humidity: ${row.humidity}`);
      console.log(`   address: ${row.address}`);
      console.log("");
    });

    // 3. Ver si hay campos nulos
    const [nullCheck] = await conn.query(`
      SELECT COUNT(*) as null_co2 FROM air_quality WHERE co2 IS NULL
    `);
    console.log("⚠️  Registros con CO2=NULL:", nullCheck[0].null_co2);

  } finally {
    await conn.end();
  }
}

checkData().catch(console.error);
