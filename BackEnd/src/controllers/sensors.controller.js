import { pool } from "../config/db_mysql.js";
import { AirQualityModel } from "../models/AirQuality.js";
import { NoiseModel } from "../models/Noise.js";
import { UndergroundModel } from "../models/Underground.js";

// ➤ POST /api/sensors/:type
export async function registerSensorData(req, res) {
  const { type } = req.params;
  const data = req.body;
  try {
    let table, mongoModel;
    switch (type) {
      case "air":
        table = "air_quality"; mongoModel = AirQualityModel; break;
      case "noise":
        table = "noise"; mongoModel = NoiseModel; break;
      case "underground":
        table = "underground"; mongoModel = UndergroundModel; break;
      default:
        return res.status(400).json({ ok: false, msg: "Tipo no válido" });
    }

    // Inserta en Mongo
    const doc = new mongoModel(data);
    await doc.save();

    // Inserta en MySQL (si está configurado)
    if (pool) {
      const keys = Object.keys(data).join(",");
      const values = Object.values(data);
      const placeholders = values.map(() => "?").join(",");
      await pool.query(`INSERT INTO ${table} (${keys}) VALUES (${placeholders})`, values);
    }

    res.json({ ok: true, msg: "Datos registrados", data });
  } catch (error) {
    console.error("❌ Error registerSensorData:", error.message);
    res.status(500).json({ ok: false, msg: "Error al registrar datos" });
  }
}

// ➤ GET /api/sensors/:type
export async function getSensorData(req, res) {
  const { type } = req.params;
  try {
    let model;
    switch (type) {
      case "air": model = AirQualityModel; break;
      case "noise": model = NoiseModel; break;
      case "underground": model = UndergroundModel; break;
      default: return res.status(400).json({ ok: false, msg: "Tipo no válido" });
    }
    const docs = await model.find().sort({ timestamp: -1 }).limit(20);
    res.json({ ok: true, data: docs });
  } catch (error) {
    res.status(500).json({ ok: false, msg: "Error al obtener datos" });
  }
}
