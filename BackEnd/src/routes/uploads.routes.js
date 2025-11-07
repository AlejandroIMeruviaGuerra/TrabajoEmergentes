// src/routes/uploads.routes.js
import express from "express";
import {
  initUpload,
  writeChunk,
  statusUpload,
  completeUpload,
} from "../services/upload.service.js";

const router = express.Router();

// Init: filename, size, type (air|noise|underground)
router.post("/init", express.json(), (req, res) => {
  try {
    const { filename, size, type } = req.body;
    if (!filename || !size || !type) return res.status(400).json({ ok: false, msg: "filename, size, type requeridos" });
    const data = initUpload({ filename, size, type });
    return res.json({ ok: true, ...data });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
});

// Subir chunk binario: PUT /api/uploads/chunk/:id/:partIndex
// Header: Content-Type: application/octet-stream
router.put("/chunk/:id/:part", express.raw({ type: "application/octet-stream", limit: "100mb" }), async (req, res) => {
  try {
    const { id, part } = req.params;
    const partIndex = parseInt(part, 10);
    const buffer = req.body; // binario
    if (!Buffer.isBuffer(buffer)) return res.status(400).json({ ok: false, msg: "Falta cuerpo binario" });

    const out = await writeChunk(id, partIndex, buffer);
    return res.json({ ok: true, ...out });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
});

// Estado (para reintentos): GET /api/uploads/status/:id
router.get("/status/:id", (req, res) => {
  try {
    const out = statusUpload(req.params.id);
    return res.json({ ok: true, ...out });
  } catch (e) {
    return res.status(404).json({ ok: false, msg: e.message });
  }
});

// Completar y ensamblar + ingestar a Kafka
router.post("/complete/:id", async (req, res) => {
  try {
    const io = req.app.get("io"); // lo seteamos en index.js
    const out = await completeUpload(req.params.id, io);
    return res.json({ ok: true, ...out });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
});

export default router;
