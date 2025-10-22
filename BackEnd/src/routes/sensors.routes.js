// src/routes/sensors.routes.js
import { Router } from "express";
import { registerSensorData, listByType } from "../controllers/sensors.controller.js";

const router = Router();

// GET últimos N (por defecto 50) -> desde MySQL
router.get("/:type", listByType);

// POST ingesta directa (útil para pruebas o para otro productor no-Kafka)
router.post("/:type", registerSensorData);

export default router;
