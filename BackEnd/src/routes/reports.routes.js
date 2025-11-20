import { Router } from "express";
import { pool } from "../config/db_mysql.js";

const router = Router();

// GET /api/reports/air/overview
router.get("/air/overview", async (req, res) => {
  try {
    const { from, to, devEui } = req.query;

    // filtros dinámicos
    const where = [];
    const params = [];

    if (from) {
      where.push("ts_window >= ?");
      params.push(from);
    }
    if (to) {
      where.push("ts_window <= ?");
      params.push(to);
    }
    if (devEui) {
      where.push("devEui = ?");
      params.push(devEui);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    // 1) Evolución temporal
    const [evolucionRows] = await pool.query(
      `
      SELECT 
        ts_window       AS t,
        devEui,
        co2_avg         AS co2,
        temperature_avg AS temperature,
        humidity_avg    AS humidity
      FROM air_quality_agg_1m
      ${whereClause}
      ORDER BY ts_window ASC
      `,
      params
    );

    // 2) Promedio por sensor (USANDO *_avg — NO sum_co2)
    const [porSensorRows] = await pool.query(
      `
      SELECT 
        devEui,
        AVG(co2_avg)         AS co2_mean,
        MAX(co2_avg)         AS co2_max,
        AVG(temperature_avg) AS temperature_mean,
        AVG(humidity_avg)    AS humidity_mean,
        SUM(count)           AS n_points
      FROM air_quality_agg_1m
      ${whereClause}
      GROUP BY devEui
      ORDER BY co2_mean DESC
      LIMIT 20
      `,
      params
    );

    // 3) Histograma
    // 4) Histograma simple de CO₂ (compatibilidad con ONLY_FULL_GROUP_BY)
    const [histRows] = await pool.query(
      `
      SELECT 
          bin_start,
          bin_start + 199 AS bin_end,
          COUNT(*) AS count
      FROM (
          SELECT FLOOR(co2_avg / 200) * 200 AS bin_start
          FROM air_quality_agg_1m
          ${whereClause}
      ) AS x
      GROUP BY bin_start
      ORDER BY bin_start ASC
      `,
      params
    );


    return res.json({
      ok: true,
      evolucion: evolucionRows,
      porSensor: porSensorRows,
      histograma: histRows,
    });
  } catch (err) {
    console.error("❌ Error en /api/reports/air/overview:", err);
    return res.status(500).json({
      ok: false,
      msg: "Error generando reporte de aire",
      detalle: err.message,
    });
  }
});

// GET /api/reports/noise/overview
router.get("/noise/overview", async (req, res) => {
  try {
    const { from, to, devEui } = req.query;

    const where = [];
    const params = [];

    if (from) { where.push("ts_window >= ?"); params.push(from); }
    if (to)   { where.push("ts_window <= ?"); params.push(to); }
    if (devEui) { where.push("devEui = ?"); params.push(devEui); }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    // 1) Evolución temporal
    const [evolucionRows] = await pool.query(
      `
      SELECT
        ts_window AS t,
        devEui,
        laeq_avg AS laeq,
        lai_avg AS lai,
        laimax_avg AS laimax
      FROM noise_agg_1m
      ${whereClause}
      ORDER BY ts_window ASC
      `,
      params
    );

    // 2) Promedio por sensor
    const [porSensorRows] = await pool.query(
      `
      SELECT
        devEui,
        AVG(laeq_avg)   AS laeq_mean,
        AVG(lai_avg)    AS lai_mean,
        AVG(laimax_avg) AS laimax_mean,
        MAX(laeq_avg)   AS laeq_max,
        MAX(laimax_avg) AS laimax_max,
        SUM(count)      AS n_points
      FROM noise_agg_1m
      ${whereClause}
      GROUP BY devEui
      ORDER BY laeq_mean DESC
      LIMIT 20
      `,
      params
    );

    // 3) Histograma
    const [histRows] = await pool.query(
      `
      SELECT 
          bin_start,
          bin_start + 19 AS bin_end,
          COUNT(*) AS count
      FROM (
          SELECT FLOOR(laeq_avg / 20) * 20 AS bin_start
          FROM noise_agg_1m
          ${whereClause}
      ) AS x
      GROUP BY bin_start
      ORDER BY bin_start ASC
      `,
      params
    );

    return res.json({
      ok: true,
      evolucion: evolucionRows,
      porSensor: porSensorRows,
      histograma: histRows,
    });

  } catch (err) {
    console.error("❌ Error en /api/reports/noise/overview:", err);
    return res.status(500).json({
      ok: false,
      msg: "Error generando reporte de ruido",
      detalle: err.message,
    });
  }
});


// GET /api/reports/underground/overview
router.get("/underground/overview", async (req, res) => {
  try {
    const { from, to, devEui } = req.query;

    const where = [];
    const params = [];

    if (from) { where.push("ts_window >= ?"); params.push(from); }
    if (to)   { where.push("ts_window <= ?"); params.push(to); }
    if (devEui) { where.push("devEui = ?"); params.push(devEui); }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    // 1) Evolución temporal
    const [evolucionRows] = await pool.query(
      `
      SELECT
        ts_window AS t,
        devEui,
        distance_avg AS distance
      FROM underground_agg_1m
      ${whereClause}
      ORDER BY ts_window ASC
      `,
      params
    );

    // 2) Promedio por sensor
    const [porSensorRows] = await pool.query(
      `
      SELECT
        devEui,
        AVG(distance_avg) AS distance_mean,
        MAX(distance_avg) AS distance_max,
        SUM(count) AS n_points
      FROM underground_agg_1m
      ${whereClause}
      GROUP BY devEui
      ORDER BY distance_mean DESC
      LIMIT 20
      `,
      params
    );

    // 3) Histograma de 20 cm
    const [histRows] = await pool.query(
      `
      SELECT
          bin_start,
          bin_start + 19 AS bin_end,
          COUNT(*) AS count
      FROM (
          SELECT FLOOR(distance_avg / 20) * 20 AS bin_start
          FROM underground_agg_1m
          ${whereClause}
      ) AS x
      GROUP BY bin_start
      ORDER BY bin_start ASC
      `,
      params
    );

    return res.json({
      ok: true,
      evolucion: evolucionRows,
      porSensor: porSensorRows,
      histograma: histRows,
    });

  } catch (err) {
    console.error("❌ Error en /api/reports/underground/overview:", err);
    return res.status(500).json({
      ok: false,
      msg: "Error generando reporte de soterrado",
      detalle: err.message,
    });
  }
});


export default router;
