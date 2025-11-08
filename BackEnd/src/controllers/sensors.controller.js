// src/controllers/sensors.controller.js
import { ingestRecord, fetchLastN, fetchPaginated } from "../services/ingest.service.js";

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
    
    // Validar tipo
    if (!["air", "noise", "underground"].includes(type)) {
      return res.status(400).json({ ok: false, msg: "Tipo inválido" });
    }

    // Parsear query params para paginación
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50)); // Max 100, default 50

    // Obtener datos paginados con total
    const result = await fetchPaginated(type, page, limit);
    
    // Calcular metadata de paginación
    const totalPages = Math.ceil(result.total / limit);
    
    res.json({
      ok: true,
      data: result.rows,
      meta: {
        total: result.total,
        pages: totalPages,
        currentPage: page,
        limit: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (e) {
    console.error("❌ listByType:", e.message);
    res.status(500).json({ ok: false, msg: "Error al listar" });
  }
}
