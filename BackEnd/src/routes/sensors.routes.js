// src/routes/sensors.routes.js
import { Router } from "express";
import { registerSensorData, listByType } from "../controllers/sensors.controller.js";
import { AirQualityModel } from "../models/AirQuality.js";
import { NoiseModel } from "../models/Noise.js";
import { UndergroundModel } from "../models/Underground.js";

const router = Router();

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

// GET últimos N (por defecto 50) -> desde MySQL
router.get("/:type", listByType);

// POST ingesta directa (útil para pruebas o para otro productor no-Kafka)
router.post("/:type", registerSensorData);

export default router;
