// src/services/ingest.service.js
import mongoose from "mongoose";
import { pool } from "../config/db_mysql.js";
import { AirQualityModel } from "../models/AirQuality.js";
import { NoiseModel } from "../models/Noise.js";
import { UndergroundModel } from "../models/Underground.js";

let ioRef = null;
export function setIO(io) { ioRef = io; }

// ----- Helpers -----
function mongoReady() {
  return mongoose.connection?.readyState === 1 || mongoose.connection?.readyState === 2;
}

function toMysqlAir(row) {
  return {
    id: row.id || null,
    time: row.time ? new Date(row.time) : null,
    devEui: row.device?.devEui || null,
    device_name: row.device?.name || null,
    device_profile: row.device?.profile || null,
    tenant: row.device?.tenant || null,
    application: row.device?.application || null,
    address: row.location?.address || null,
    lat: row.location?.lat ?? null,
    lng: row.location?.lng ?? null,
    sf: row.radio?.sf ?? null,
    bw: row.radio?.bw ?? null,
    dr: row.radio?.dr ?? null,
    co2: row.measures?.co2 ?? null,
    temperature: row.measures?.temperature ?? null,
    humidity: row.measures?.humidity ?? null,
    pressure: row.measures?.pressure ?? null,
    co2_status: row.labels?.co2_status || null,
    co2_message: row.labels?.co2_message || null,
    temperature_message: row.labels?.temperature_message || null,
    humidity_message: row.labels?.humidity_message || null,
    pressure_status: row.labels?.pressure_status || null,
  };
}

function toMysqlNoise(row) {
  return {
    id: row.id || null,
    time: row.time ? new Date(row.time) : null,
    devEui: row.device?.devEui || null,
    device_name: row.device?.name || null,
    device_profile: row.device?.profile || null,
    address: row.location?.address || null,
    lat: row.location?.lat ?? null,
    lng: row.location?.lng ?? null,
    sf: row.radio?.sf ?? null,
    bw: row.radio?.bw ?? null,
    dr: row.radio?.dr ?? null,
    laeq: row.measures?.laeq ?? null,
    lai: row.measures?.lai ?? null,
    laimax: row.measures?.laimax ?? null,
    battery: row.battery ?? null,
    status: row.status || null,
  };
}

function toMysqlUnderground(row) {
  return {
    id: row.id || null,
    time: row.time ? new Date(row.time) : null,
    devEui: row.device?.devEui || null,
    device_name: row.device?.name || null,
    device_profile: row.device?.profile || null,
    address: row.location?.address || null,
    lat: row.location?.lat ?? null,
    lng: row.location?.lng ?? null,
    sf: row.radio?.sf ?? null,
    bw: row.radio?.bw ?? null,
    dr: row.radio?.dr ?? null,
    distance: row.measures?.distance ?? null,
    unit: row.measures?.unit || null,
    battery: row.battery ?? null,
    status: row.status || null,
  };
}

async function insertAirMySQL(obj) {
  const sql = `
    INSERT INTO air_quality
    (id, time, devEui, device_name, device_profile, tenant, application, address,
     lat, lng, sf, bw, dr, co2, temperature, humidity, pressure,
     co2_status, co2_message, temperature_message, humidity_message, pressure_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      time=VALUES(time), devEui=VALUES(devEui), device_name=VALUES(device_name),
      device_profile=VALUES(device_profile), tenant=VALUES(tenant), application=VALUES(application),
      address=VALUES(address), lat=VALUES(lat), lng=VALUES(lng), sf=VALUES(sf), bw=VALUES(bw), dr=VALUES(dr),
      co2=VALUES(co2), temperature=VALUES(temperature), humidity=VALUES(humidity), pressure=VALUES(pressure),
      co2_status=VALUES(co2_status), co2_message=VALUES(co2_message),
      temperature_message=VALUES(temperature_message), humidity_message=VALUES(humidity_message),
      pressure_status=VALUES(pressure_status)
  `;
  const vals = [
    obj.id, obj.time, obj.devEui, obj.device_name, obj.device_profile, obj.tenant, obj.application, obj.address,
    obj.lat, obj.lng, obj.sf, obj.bw, obj.dr, obj.co2, obj.temperature, obj.humidity, obj.pressure,
    obj.co2_status, obj.co2_message, obj.temperature_message, obj.humidity_message, obj.pressure_status,
  ];
  await pool.query(sql, vals);
}

async function insertNoiseMySQL(obj) {
  const sql = `
    INSERT INTO noise
    (id, time, devEui, device_name, device_profile, address, lat, lng, sf, bw, dr,
     laeq, lai, laimax, battery, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      time=VALUES(time), devEui=VALUES(devEui), device_name=VALUES(device_name),
      device_profile=VALUES(device_profile), address=VALUES(address), lat=VALUES(lat),
      lng=VALUES(lng), sf=VALUES(sf), bw=VALUES(bw), dr=VALUES(dr),
      laeq=VALUES(laeq), lai=VALUES(lai), laimax=VALUES(laimax),
      battery=VALUES(battery), status=VALUES(status)
  `;
  const vals = [
    obj.id, obj.time, obj.devEui, obj.device_name, obj.device_profile, obj.address, obj.lat, obj.lng,
    obj.sf, obj.bw, obj.dr, obj.laeq, obj.lai, obj.laimax, obj.battery, obj.status,
  ];
  await pool.query(sql, vals);
}

async function insertUndergroundMySQL(obj) {
  const sql = `
    INSERT INTO underground
    (id, time, devEui, device_name, device_profile, address, lat, lng, sf, bw, dr,
     distance, unit, battery, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      time=VALUES(time), devEui=VALUES(devEui), device_name=VALUES(device_name),
      device_profile=VALUES(device_profile), address=VALUES(address), lat=VALUES(lat),
      lng=VALUES(lng), sf=VALUES(sf), bw=VALUES(bw), dr=VALUES(dr),
      distance=VALUES(distance), unit=VALUES(unit), battery=VALUES(battery), status=VALUES(status)
  `;
  const vals = [
    obj.id, obj.time, obj.devEui, obj.device_name, obj.device_profile, obj.address, obj.lat, obj.lng,
    obj.sf, obj.bw, obj.dr, obj.distance, obj.unit, obj.battery, obj.status,
  ];
  await pool.query(sql, vals);
}

// ----- API principal (usada por controller y por Kafka consumer) -----
export async function ingestRecord(type, payload) {
  // 1) Mongo
  if (mongoReady()) {
    try {
      if (type === "air")        await AirQualityModel.create(payload);
      else if (type === "noise") await NoiseModel.create(payload);
      else if (type === "underground") await UndergroundModel.create(payload);
    } catch (e) {
      console.warn("⚠️ Mongo save warning:", e.message);
    }
  } else {
    console.warn("⚠️ Mongo no disponible, se omite save()");
  }

  // 2) MySQL (aplanado)
  try {
    if (!pool) throw new Error("MySQL pool no inicializado");
    if (type === "air")        await insertAirMySQL(toMysqlAir(payload));
    else if (type === "noise") await insertNoiseMySQL(toMysqlNoise(payload));
    else if (type === "underground") await insertUndergroundMySQL(toMysqlUnderground(payload));
  } catch (e) {
    console.error("❌ MySQL insert error:", e.message);
  }

  // 3) Tiempo real → frontend
  if (ioRef) {
    ioRef.emit("new-sensor-data", { type, value: flattenForFrontend(type, payload) });
  }
}

// lo que el frontend espera graficar rápidamente
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
    humidity: p.measures?.humidity ?? null,         // por compat (si algún payload trae)
    temperature: p.measures?.temperature ?? null,   // por compat
    distance: p.measures?.distance ?? null,
  };
}

// ----- Queries de lectura para endpoints GET -----
export async function fetchLastN(type, n = 50) {
  if (!pool) throw new Error("MySQL no conectado");
  let sql = "";
  if (type === "air")        sql = "SELECT * FROM air_quality ORDER BY time DESC LIMIT ?";
  else if (type === "noise") sql = "SELECT * FROM noise ORDER BY time DESC LIMIT ?";
  else if (type === "underground") sql = "SELECT * FROM underground ORDER BY time DESC LIMIT ?";
  else throw new Error("Tipo inválido");
  const [rows] = await pool.query(sql, [n]);
  return rows;
}
