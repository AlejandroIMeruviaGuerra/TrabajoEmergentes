import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export let pool = null;

export async function connectMySQL() {
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true, 
    });
    console.log("✅ Conectado a MySQL");
    await initTables();
  } catch (err) {
    console.error("❌ Error MySQL:", err.message);
  }
}

async function initTables() {
  const ddl = `
  CREATE TABLE IF NOT EXISTS air_quality (
    id VARCHAR(64) PRIMARY KEY,
    time DATETIME,
    devEui VARCHAR(64),
    device_name VARCHAR(64),
    device_profile VARCHAR(64),
    tenant VARCHAR(128),
    application VARCHAR(128),
    address VARCHAR(128),
    lat DOUBLE, lng DOUBLE,
    sf INT, bw INT, dr INT,
    co2 FLOAT, temperature FLOAT, humidity FLOAT, pressure FLOAT,
    co2_status VARCHAR(64), co2_message VARCHAR(255),
    temperature_message VARCHAR(255), humidity_message VARCHAR(255), pressure_status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS noise (
    id VARCHAR(64) PRIMARY KEY,
    time DATETIME,
    devEui VARCHAR(64),
    device_name VARCHAR(64),
    device_profile VARCHAR(64),
    address VARCHAR(128),
    lat DOUBLE, lng DOUBLE,
    sf INT, bw INT, dr INT,
    laeq FLOAT, lai FLOAT, laimax FLOAT,
    battery FLOAT, status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS underground (
    id VARCHAR(64) PRIMARY KEY,
    time DATETIME,
    devEui VARCHAR(64),
    device_name VARCHAR(64),
    device_profile VARCHAR(64),
    address VARCHAR(128),
    lat DOUBLE, lng DOUBLE,
    sf INT, bw INT, dr INT,
    distance FLOAT, unit VARCHAR(16),
    battery FLOAT, status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  // Ejecuta múltiples statements
  await pool.query(ddl);
}
