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
  // 1) Crear tablas (sin índices)
  const ddl = `

    CREATE TABLE IF NOT EXISTS air_quality_agg_1m (
    devEui VARCHAR(64),
    ts_window DATETIME,
    location_name VARCHAR(128),
    co2_avg FLOAT, temperature_avg FLOAT, humidity_avg FLOAT, pressure_avg FLOAT,
    count INT,
    PRIMARY KEY (devEui, ts_window)
  );
  
  CREATE TABLE IF NOT EXISTS noise_agg_1m (
    devEui VARCHAR(64),
    ts_window DATETIME,
    location_name VARCHAR(128),
    laeq_avg FLOAT, lai_avg FLOAT, laimax_avg FLOAT,
    count INT,
    PRIMARY KEY (devEui, ts_window)
  );
  
  CREATE TABLE IF NOT EXISTS underground_agg_1m (
    devEui VARCHAR(64),
    ts_window DATETIME,
    location_name VARCHAR(128),
    distance_avg FLOAT,
    count INT,
    PRIMARY KEY (devEui, ts_window)
  );

  CREATE TABLE IF NOT EXISTS air_quality (
    id VARCHAR(64) PRIMARY KEY,
    time DATETIME,
    devEui VARCHAR(64),
    device_name VARCHAR(128),
    device_profile VARCHAR(128),
    tenant VARCHAR(128),
    application VARCHAR(128),
    address VARCHAR(255),
    lat DOUBLE, lng DOUBLE,
    sf INT, bw INT, dr INT,
    co2 DOUBLE, temperature DOUBLE, humidity DOUBLE, pressure DOUBLE,
    co2_status VARCHAR(64), co2_message VARCHAR(255),
    temperature_message VARCHAR(255), humidity_message VARCHAR(255), pressure_status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS noise (
    id VARCHAR(64) PRIMARY KEY,
    time DATETIME,
    devEui VARCHAR(64),
    device_name VARCHAR(128),
    device_profile VARCHAR(128),
    address VARCHAR(255),
    lat DOUBLE, lng DOUBLE,
    sf INT, bw INT, dr INT,
    laeq DOUBLE, lai DOUBLE, laimax DOUBLE,
    battery DOUBLE, status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS underground (
    id VARCHAR(64) PRIMARY KEY,
    time DATETIME,
    devEui VARCHAR(64),
    device_name VARCHAR(128),
    device_profile VARCHAR(128),
    address VARCHAR(255),
    lat DOUBLE, lng DOUBLE,
    sf INT, bw INT, dr INT,
    distance DOUBLE, unit VARCHAR(16),
    battery DOUBLE, status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(ddl);

  // 2) Crear índices (si ya existen, ignorar)
  const indexStmts = [
    `ALTER TABLE air_quality ADD INDEX idx_air_time (time)`,
    `ALTER TABLE air_quality ADD INDEX idx_air_dev_time (devEui, time)`,
    `ALTER TABLE noise ADD INDEX idx_noise_time (time)`,
    `ALTER TABLE noise ADD INDEX idx_noise_dev_time (devEui, time)`,
    `ALTER TABLE underground ADD INDEX idx_under_time (time)`,
    `ALTER TABLE underground ADD INDEX idx_under_dev_time (devEui, time)`
  ];

  for (const sql of indexStmts) {
    try { await pool.query(sql); }
    catch (e) {
      // 1061 = "Duplicate key name" (índice ya existe) -> lo ignoramos
      if (e && e.errno !== 1061) console.warn(`⚠️ Índice: ${e.message}`);
    }
  }

  console.log("✅ Tablas e índices verificados");
}

