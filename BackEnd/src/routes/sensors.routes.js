// src/routes/sensors.routes.js
import { Router } from "express";
import { registerSensorData, listByType } from "../controllers/sensors.controller.js";
import { AirQualityModel } from "../models/AirQuality.js";
import { NoiseModel } from "../models/Noise.js";
import { UndergroundModel } from "../models/Underground.js";
import { apiLimiter, writeApiLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Aplicar rate limiting general a todas las rutas de sensores
router.use(apiLimiter);

// ===== CAMBIO: NUEVO ENDPOINT AGREGADO =====
// ANTES: No existía endpoint para consultar conteos de MongoDB
// DESPUÉS: Agregado endpoint /mongo/count
// RAZÓN: Permitir verificar progreso de ingesta en MongoDB sin instalar mongosh
// USO: GET http://localhost:4000/api/sensors/mongo/count
router.get("/mongo/count", async (req, res) => {
  try {
    const airCount = await AirQualityModel.countDocuments();
    const noiseCount = await NoiseModel.countDocuments();
    const undergroundCount = await UndergroundModel.countDocuments();
    
    res.json({
      mongodb: {
        air_quality: airCount,
        noise: noiseCount,
        underground: undergroundCount,
        total: airCount + noiseCount + undergroundCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET últimos N con paginación -> desde MySQL
// Soporta query params: ?page=1&limit=50
router.get("/:type", listByType);

// POST ingesta directa (útil para pruebas o para otro productor no-Kafka)
// Rate limiting estricto para escrituras
router.post("/:type", writeApiLimiter, registerSensorData);

export default router;
