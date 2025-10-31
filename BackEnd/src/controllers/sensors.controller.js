// src/controllers/sensors.controller.js
import { ingestRecord, fetchLastN } from "../services/ingest.service.js";

export async function registerSensorData(req, res) {
  try {
    const { type } = req.params; // 'air' | 'noise' | 'underground'
    const payload = req.body;    // JSON normalizado
    if (!["air", "noise", "underground"].includes(type)) {
      return res.status(400).json({ ok: false, msg: "Tipo inválido" });
    }
    await ingestRecord(type, payload);
    res.json({ ok: true, msg: "Ingesta registrada", type });
  } catch (e) {
    console.error("❌ registerSensorData:", e.message);
    res.status(500).json({ ok: false, msg: "Error al registrar" });
  }
}

export async function listByType(req, res) {
  try {
    const { type } = req.params;
    const limit = Number(req.query.limit || 50);
    if (!["air", "noise", "underground"].includes(type)) {
      return res.status(400).json({ ok: false, msg: "Tipo inválido" });
    }
    const rows = await fetchLastN(type, limit);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("❌ listByType:", e.message);
    res.status(500).json({ ok: false, msg: "Error al listar" });
  }
}
