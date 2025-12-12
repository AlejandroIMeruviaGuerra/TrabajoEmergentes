// src/routes/ml.routes.js
import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_PATH = process.env.PYTHON_PATH || "python";
const ML_MODELS_DIR = process.env.ML_MODELS_DIR || path.join(__dirname, "../../ml_models");
const ML_SCRIPTS_DIR = path.join(__dirname, "../../ml_scripts");

/**
 * Helper: Genera endpoint de entrenamiento para un sensor type
 */
const createTrainRoute = (sensorType) => {
  return async (req, res) => {
    try {
      const io = req.app.get("io");
      const scriptPath = path.join(ML_SCRIPTS_DIR, `train_kmeans_${sensorType}.py`);

      const proc = spawn(PYTHON_PATH, [scriptPath], {
        env: {
          ...process.env,
          API_BASE: process.env.API_BASE || "http://localhost:4000",
          ML_MODELS_DIR,
        },
      });

      const jobId = Date.now().toString();

      proc.stdout.on("data", (data) => {
        const text = data.toString().trim();
        text.split("\n").forEach((line) => {
          if (line.startsWith("PROGRESS:")) {
            const [, pct, msg] = line.split(":");
            io?.emit("ml:progress", {
              jobId,
              sensor: sensorType,
              progress: Number(pct),
              message: msg || "",
            });
          } else if (line.startsWith("{")) {
            try {
              const info = JSON.parse(line);
              io?.emit("ml:done", {
                jobId,
                sensor: sensorType,
                info,
              });
            } catch (e) {
              // ignore
            }
          }
        });
      });

      proc.stderr.on("data", (data) => {
        console.error(`ML ${sensorType} train stderr:`, data.toString());
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          io?.emit("ml:error", {
            jobId,
            sensor: sensorType,
            error: `Exit code ${code}`,
          });
        }
      });

      return res.json({ ok: true, jobId });
    } catch (err) {
      console.error(`❌ Error en /api/ml/${sensorType}/train:`, err);
      return res.status(500).json({ ok: false, msg: "Error lanzando entrenamiento" });
    }
  };
};

/**
 * Helper: Genera endpoint de predicción para un sensor type
 */
const createPredictRoute = (sensorType) => {
  return async (req, res) => {
    try {
      const scriptPath = path.join(ML_SCRIPTS_DIR, `predict_kmeans_${sensorType}.py`);

      const proc = spawn(PYTHON_PATH, [scriptPath], {
        env: {
          ...process.env,
          API_BASE: process.env.API_BASE || "http://localhost:4000",
          ML_MODELS_DIR,
        },
      });

      let output = "";
      let errorOut = "";

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        errorOut += data.toString();
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          console.error(`ML ${sensorType} predict error:`, errorOut);
          return res.status(500).json({ ok: false, msg: "Error en predicción ML" });
        }
        try {
          const jsonLine = output.trim().split("\n").slice(-1)[0];
          const result = JSON.parse(jsonLine);
          return res.json({ ok: true, ...result });
        } catch (e) {
          console.error("parse predict output error:", e, output);
          return res.status(500).json({ ok: false, msg: "Error parseando salida ML" });
        }
      });
    } catch (err) {
      console.error(`❌ Error en /api/ml/${sensorType}/predict:`, err);
      return res.status(500).json({ ok: false, msg: "Error en predicción" });
    }
  };
};


// Registrar rutas para todos los tipos de sensores
router.post("/air/train", createTrainRoute("air"));
router.get("/air/predict", createPredictRoute("air"));

router.post("/noise/train", createTrainRoute("noise"));
router.get("/noise/predict", createPredictRoute("noise"));

router.post("/underground/train", createTrainRoute("underground"));
router.get("/underground/predict", createPredictRoute("underground"));

export default router;
