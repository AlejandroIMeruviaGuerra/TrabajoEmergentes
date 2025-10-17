import { Router } from "express";
import { registerSensorData, getSensorData } from "../controllers/sensors.controller.js";

const router = Router();

// /api/sensors/air, /noise, /underground
router.post("/:type", registerSensorData);
router.get("/:type", getSensorData);

export default router;
