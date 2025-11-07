// src/routes/health.routes.js
import { Router } from "express";
import { performHealthCheck, performReadinessCheck } from "../utils/health.js";
import { getConsumerMetrics } from "../kafka/consumer.js";

const router = Router();

/**
 * GET /api/health
 * Health check completo - verifica todas las dependencias
 * 
 * Responde:
 *  - 200 si el sistema está saludable (MySQL + Kafka Consumer OK)
 *  - 503 si alguna dependencia crítica falla
 */
router.get("/", async (req, res) => {
  try {
    const health = await performHealthCheck();
    
    const statusCode = health.ok ? 200 : 503;
    
    res.status(statusCode).json({
      status: health.ok ? "healthy" : "unhealthy",
      timestamp: health.timestamp,
      uptime: health.uptime,
      checks: health.checks,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness check - verifica si el servicio está listo para recibir tráfico
 * Solo valida dependencias críticas (MySQL + Kafka Consumer)
 * 
 * Útil para Kubernetes readiness probes
 */
router.get("/ready", async (req, res) => {
  try {
    const readiness = await performReadinessCheck();
    
    const statusCode = readiness.ready ? 200 : 503;
    
    res.status(statusCode).json({
      ready: readiness.ready,
      timestamp: readiness.timestamp,
      critical: readiness.critical
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/health/live
 * Liveness check - verifica que el proceso esté vivo
 * Responde siempre 200 si el servidor está corriendo
 * 
 * Útil para Kubernetes liveness probes
 */
router.get("/live", (req, res) => {
  res.json({
    alive: true,
    timestamp: Date.now(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * GET /api/health/metrics
 * Métricas básicas del sistema
 */
router.get("/metrics", (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    },
    cpu: {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system
    },
    node: process.version,
    platform: process.platform,
    arch: process.arch
  });
});

/**
 * GET /api/health/consumer
 * Métricas específicas del Kafka consumer
 * Incluye mensajes procesados, errores, tiempos de procesamiento, y throughput
 */
router.get("/consumer", (req, res) => {
  try {
    const metrics = getConsumerMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve consumer metrics",
      message: error.message,
      timestamp: Date.now()
    });
  }
});

export default router;
