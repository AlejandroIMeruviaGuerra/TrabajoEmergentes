// src/routes/noise.routes.js
import { Router } from "express";
import { pool } from "../config/db_mysql.js";

const router = Router();

// GET /api/sensors/noise → últimos 200 registros agregados
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        devEui,
        ts_window AS t,
        laeq_avg AS laeq,
        lai_avg AS lai,
        laimax_avg AS laimax
      FROM noise_agg_1m
      ORDER BY ts_window DESC
      LIMIT 200
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error en GET /api/sensors/noise:", err);
    res.status(500).json({ ok: false });
  }
});

export default router;
