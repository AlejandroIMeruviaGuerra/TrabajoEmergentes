import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export let pool = null;

export async function connectMySQL() {
  try {
    // Primero conectar SIN especificar base de datos para crear la BD
    const tempPool = await mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      waitForConnections: true,
      connectionLimit: 2,
      multipleStatements: true,
    });

    const conn = await tempPool.getConnection();
    
    // Crear base de datos si no existe
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Base de datos '${process.env.DB_NAME}' verificada/creada`);
    
    conn.release();
    await tempPool.end();

    // Ahora conectar con la base de datos
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

  // 2) Crear índices optimizados (si ya existen, ignorar)
  // Índices individuales y compuestos para consultas rápidas
  const indexStmts = [
    // Air Quality - Índices para consultas comunes
    `CREATE INDEX IF NOT EXISTS idx_air_time ON air_quality(time)`,
    `CREATE INDEX IF NOT EXISTS idx_air_devEui ON air_quality(devEui)`,
    `CREATE INDEX IF NOT EXISTS idx_air_time_dev ON air_quality(time, devEui)`,
    `CREATE INDEX IF NOT EXISTS idx_air_created ON air_quality(created_at)`,
    
    // Noise - Índices para consultas comunes
    `CREATE INDEX IF NOT EXISTS idx_noise_time ON noise(time)`,
    `CREATE INDEX IF NOT EXISTS idx_noise_devEui ON noise(devEui)`,
    `CREATE INDEX IF NOT EXISTS idx_noise_time_dev ON noise(time, devEui)`,
    `CREATE INDEX IF NOT EXISTS idx_noise_created ON noise(created_at)`,
    
    // Underground - Índices para consultas comunes
    `CREATE INDEX IF NOT EXISTS idx_underground_time ON underground(time)`,
    `CREATE INDEX IF NOT EXISTS idx_underground_devEui ON underground(devEui)`,
    `CREATE INDEX IF NOT EXISTS idx_underground_time_dev ON underground(time, devEui)`,
    `CREATE INDEX IF NOT EXISTS idx_underground_created ON underground(created_at)`,
    
    // Agregados 1m - Índices para ventanas temporales
    `CREATE INDEX IF NOT EXISTS idx_air_agg_window ON air_quality_agg_1m(ts_window)`,
    `CREATE INDEX IF NOT EXISTS idx_noise_agg_window ON noise_agg_1m(ts_window)`,
    `CREATE INDEX IF NOT EXISTS idx_underground_agg_window ON underground_agg_1m(ts_window)`
  ];

  let indexCreated = 0;
  let indexSkipped = 0;

  for (const sql of indexStmts) {
    try { 
      await pool.query(sql);
      indexCreated++;
    }
    catch (e) {
      // Índice ya existe o error menor - continuar
      indexSkipped++;
      if (e && e.errno !== 1061 && !e.message.includes('Duplicate key')) {
        console.warn(`⚠️ Índice: ${e.message}`);
      }
    }
  }

  console.log(`✅ Tablas verificadas | Índices: ${indexCreated} creados, ${indexSkipped} ya existían`);
}

