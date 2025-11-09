// src/services/ingest.service.js
import mongoose from "mongoose";
import { pool } from "../config/db_mysql.js";
import { AirQualityModel } from "../models/AirQuality.js";
import { NoiseModel } from "../models/Noise.js";
import { UndergroundModel } from "../models/Underground.js";

let ioRef = null;
export function setIO(io) { ioRef = io; }

// ===== Helpers =====
function mongoReady() {
  return mongoose.connection?.readyState === 1 || mongoose.connection?.readyState === 2;
}

function ensureId(str) {
  return str ?? String(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}

// ---- Aplana para MySQL (soporta formato anidado Y plano) ----
// MODIFICADO: Se agregaron fallbacks para soportar ambos formatos de mensaje:
//   - Formato anidado (sistema real): { device: { devEui: ... }, measures: { co2: ... } }
//   - Formato plano (pruebas): { devEui: ..., co2: ... }
// Cambios específicos:
//   - devEui: Ahora busca en row.device?.devEui || row.devEui
//   - address: Ahora busca en row.location?.address || row.locationName
//   - co2, temperature, humidity, pressure: Busca en row.measures?.X ?? row.X
// Esto permite que mensajes de Kafka con estructura simple pasen validación Joi
// y se persistan correctamente en MySQL sin perder datos.
function toMysqlAir(row) {
  return {
    id: ensureId(row.id),
    time: row.time ? new Date(row.time) : null,
    devEui: row.device?.devEui || row.devEui || null, // MODIFICADO: Soporte formato plano
    device_name: row.device?.name || null,
    device_profile: row.device?.profile || null,
    tenant: row.device?.tenant || null,
    application: row.device?.application || null,
    address: row.location?.address || row.locationName || null, // MODIFICADO: Soporte locationName
    lat: row.location?.lat ?? null,
    lng: row.location?.lng ?? null,
    sf: row.radio?.sf ?? null,
    bw: row.radio?.bw ?? null,
    dr: row.radio?.dr ?? null,
    co2: row.measures?.co2 ?? row.co2 ?? null, // MODIFICADO: Soporte formato plano
    temperature: row.measures?.temperature ?? row.temperature ?? null, // MODIFICADO: Soporte formato plano
    humidity: row.measures?.humidity ?? row.humidity ?? null, // MODIFICADO: Soporte formato plano
    pressure: row.measures?.pressure ?? row.pressure ?? null, // MODIFICADO: Soporte formato plano
    co2_status: row.labels?.co2_status || null,
    co2_message: row.labels?.co2_message || null,
    temperature_message: row.labels?.temperature_message || null,
    humidity_message: row.labels?.humidity_message || null,
    pressure_status: row.labels?.pressure_status || null,
  };
}
// MODIFICADO: Misma lógica que toMysqlAir - soporte para formato anidado Y plano
// Cambios específicos:
//   - devEui: row.device?.devEui || row.devEui
//   - address: row.location?.address || row.locationName
//   - laeq, lai, laimax: row.measures?.X ?? row.X
function toMysqlNoise(row) {
  return {
    id: ensureId(row.id),
    time: row.time ? new Date(row.time) : null,
    devEui: row.device?.devEui || row.devEui || null, // MODIFICADO: Soporte formato plano
    device_name: row.device?.name || null,
    device_profile: row.device?.profile || null,
    address: row.location?.address || row.locationName || null, // MODIFICADO: Soporte locationName
    lat: row.location?.lat ?? null,
    lng: row.location?.lng ?? null,
    sf: row.radio?.sf ?? null,
    bw: row.radio?.bw ?? null,
    dr: row.radio?.dr ?? null,
    laeq: row.measures?.laeq ?? row.laeq ?? null, // MODIFICADO: Soporte formato plano
    lai: row.measures?.lai ?? row.lai ?? null, // MODIFICADO: Soporte formato plano
    laimax: row.measures?.laimax ?? row.laimax ?? null, // MODIFICADO: Soporte formato plano
    battery: row.battery ?? null,
    status: row.status || null,
  };
}
// MODIFICADO: Misma lógica que toMysqlAir y toMysqlNoise - soporte para formato anidado Y plano
// Cambios específicos:
//   - devEui: row.device?.devEui || row.devEui
//   - address: row.location?.address || row.locationName
//   - distance: row.measures?.distance ?? row.distance
function toMysqlUnderground(row) {
  return {
    id: ensureId(row.id),
    time: row.time ? new Date(row.time) : null,
    devEui: row.device?.devEui || row.devEui || null, // MODIFICADO: Soporte formato plano
    device_name: row.device?.name || null,
    device_profile: row.device?.profile || null,
    address: row.location?.address || row.locationName || null, // MODIFICADO: Soporte locationName
    lat: row.location?.lat ?? null,
    lng: row.location?.lng ?? null,
    sf: row.radio?.sf ?? null,
    bw: row.radio?.bw ?? null,
    dr: row.radio?.dr ?? null,
    distance: row.measures?.distance ?? row.distance ?? null, // MODIFICADO: Soporte formato plano
    unit: row.measures?.unit || null,
    battery: row.battery ?? null,
    status: row.status || null,
  };
}

// ===== Buffers por tipo =====
const BUFFERS = { air: [], noise: [], underground: [] };
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 1000);
const FLUSH_MS = Number(process.env.FLUSH_MS || 2000);

// Timer de flush periódico
setInterval(() => flushAll().catch(()=>{}), FLUSH_MS);

// API principal (la llama el controller y el Kafka consumer)
export async function ingestRecord(type, payload) {
  // Normaliza mínimos
  if (payload?.time && typeof payload.time === "string") payload.time = new Date(payload.time);

  // 1) Buffer Mongo
  BUFFERS[type].push(payload);
  if (BUFFERS[type].length >= BATCH_SIZE) await flushType(type);

  // 2) Emitir algo al frontend (muestra pequeña para no inundar)
  if (ioRef) {
    ioRef.emit("new-sensor-data", { type, value: flattenForFrontend(type, payload) });
  }
}

async function flushAll() {
  await Promise.all(["air","noise","underground"].map(flushType));
}

async function flushType(type) {
  const list = BUFFERS[type];
  if (!list.length) return;

  const batch = list.splice(0, list.length);

  // ---- 2.1 Mongo bulk ----
  if (mongoReady()) {
    try {
      if (type === "air") await AirQualityModel.collection.insertMany(batch, { ordered: false });
      else if (type === "noise") await NoiseModel.collection.insertMany(batch, { ordered: false });
      else if (type === "underground") await UndergroundModel.collection.insertMany(batch, { ordered: false });
    } catch (e) {
      console.warn(`⚠️ Mongo bulk ${type}:`, e.message);
    }
  }

  // ---- 2.2 MySQL bulk (ON DUPLICATE) ----
  try {
    const sqlMap = {
      air: `INSERT INTO air_quality
            (id, time, devEui, device_name, device_profile, tenant, application, address,
             lat, lng, sf, bw, dr, co2, temperature, humidity, pressure,
             co2_status, co2_message, temperature_message, humidity_message, pressure_status)
            VALUES ?
            ON DUPLICATE KEY UPDATE
              time=VALUES(time), devEui=VALUES(devEui), device_name=VALUES(device_name),
              device_profile=VALUES(device_profile), tenant=VALUES(tenant), application=VALUES(application),
              address=VALUES(address), lat=VALUES(lat), lng=VALUES(lng), sf=VALUES(sf), bw=VALUES(bw), dr=VALUES(dr),
              co2=VALUES(co2), temperature=VALUES(temperature), humidity=VALUES(humidity), pressure=VALUES(pressure),
              co2_status=VALUES(co2_status), co2_message=VALUES(co2_message),
              temperature_message=VALUES(temperature_message), humidity_message=VALUES(humidity_message),
              pressure_status=VALUES(pressure_status)`,
      noise: `INSERT INTO noise
              (id, time, devEui, device_name, device_profile, address, lat, lng, sf, bw, dr,
               laeq, lai, laimax, battery, status)
              VALUES ?
              ON DUPLICATE KEY UPDATE
                time=VALUES(time), devEui=VALUES(devEui), device_name=VALUES(device_name),
                device_profile=VALUES(device_profile), address=VALUES(address), lat=VALUES(lat),
                lng=VALUES(lng), sf=VALUES(sf), bw=VALUES(bw), dr=VALUES(dr),
                laeq=VALUES(laeq), lai=VALUES(lai), laimax=VALUES(laimax),
                battery=VALUES(battery), status=VALUES(status)`,
      underground: `INSERT INTO underground
                    (id, time, devEui, device_name, device_profile, address, lat, lng, sf, bw, dr,
                     distance, unit, battery, status)
                    VALUES ?
                    ON DUPLICATE KEY UPDATE
                      time=VALUES(time), devEui=VALUES(devEui), device_name=VALUES(device_name),
                      device_profile=VALUES(device_profile), address=VALUES(address), lat=VALUES(lat),
                      lng=VALUES(lng), sf=VALUES(sf), bw=VALUES(bw), dr=VALUES(dr),
                      distance=VALUES(distance), unit=VALUES(unit), battery=VALUES(battery), status=VALUES(status)`,
    };

    // mapea batch al formato MySQL
    const values = batch.map((p) => {
      if (type === "air") {
        const o = toMysqlAir(p);
        return [o.id,o.time,o.devEui,o.device_name,o.device_profile,o.tenant,o.application,o.address,o.lat,o.lng,o.sf,o.bw,o.dr,o.co2,o.temperature,o.humidity,o.pressure,o.co2_status,o.co2_message,o.temperature_message,o.humidity_message,o.pressure_status];
      }
      if (type === "noise") {
        const o = toMysqlNoise(p);
        return [o.id,o.time,o.devEui,o.device_name,o.device_profile,o.address,o.lat,o.lng,o.sf,o.bw,o.dr,o.laeq,o.lai,o.laimax,o.battery,o.status];
      }
      const o = toMysqlUnderground(p);
      return [o.id,o.time,o.devEui,o.device_name,o.device_profile,o.address,o.lat,o.lng,o.sf,o.bw,o.dr,o.distance,o.unit,o.battery,o.status];
    });

    await pool.query(sqlMap[type], [values]);
  } catch (e) {
    console.error(`❌ MySQL bulk ${type}:`, e.message);
  }
}

// ---- payload “ligero” para la UI ----
function flattenForFrontend(type, p) {
  if (type === "air") {
    return {
      co2: p.measures?.co2 ?? null,
      temperature: p.measures?.temperature ?? null,
      humidity: p.measures?.humidity ?? null,
      pressure: p.measures?.pressure ?? null,
    };
  }
  if (type === "noise") {
    return {
      decibels: p.measures?.laeq ?? null,
      laeq: p.measures?.laeq ?? null,
      lai: p.measures?.lai ?? null,
      laimax: p.measures?.laimax ?? null,
    };
  }
  return {
    distance: p.measures?.distance ?? null,
    humidity: p.measures?.humidity ?? null,
    temperature: p.measures?.temperature ?? null,
  };
}

// ---- lecturas para GET (puedes dejar igual) ----
export async function fetchLastN(type, n = 50) {
  let sql = "";
  if (type === "air")        sql = "SELECT * FROM air_quality ORDER BY time DESC LIMIT ?";
  else if (type === "noise") sql = "SELECT * FROM noise ORDER BY time DESC LIMIT ?";
  else if (type === "underground") sql = "SELECT * FROM underground ORDER BY time DESC LIMIT ?";
  else throw new Error("Tipo inválido");
  const [rows] = await pool.query(sql, [n]);
  return rows;
}

/**
 * Obtener datos paginados con conteo total
 * @param {string} type - Tipo de sensor: 'air', 'noise', 'underground'
 * @param {number} page - Número de página (1-indexed)
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise<{rows: Array, total: number}>}
 */
export async function fetchPaginated(type, page = 1, limit = 50) {
  // Validar tipo
  const validTypes = ["air", "noise", "underground"];
  if (!validTypes.includes(type)) {
    throw new Error("Tipo inválido");
  }

  // Mapear tipo a nombre de tabla
  const tableMap = {
    air: "air_quality",
    noise: "noise",
    underground: "underground"
  };
  const tableName = tableMap[type];

  // Calcular offset
  const offset = (page - 1) * limit;

  // Query para obtener datos paginados
  const dataSql = `SELECT * FROM ${tableName} ORDER BY time DESC LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(dataSql, [limit, offset]);

  // Query para obtener conteo total
  const countSql = `SELECT COUNT(*) as total FROM ${tableName}`;
  const [countResult] = await pool.query(countSql);
  const total = countResult[0].total;

  return {
    rows,
    total
  };
}
