// src/routes/underground.routes.js
import { Router } from "express";
import { pool } from "../config/db_mysql.js";

const router = Router();

// GET /api/sensors/underground → últimos 200 registros agregados
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        devEui,
        ts_window AS t,
        distance_avg AS distance
      FROM underground_agg_1m
      ORDER BY ts_window DESC
      LIMIT 200
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error en GET /api/sensors/underground:", err);
    res.status(500).json({ ok: false });
  }
});

export default router;
