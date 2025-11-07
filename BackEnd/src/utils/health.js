// src/utils/health.js
import { pool as mysqlPool } from "../config/db_mysql.js";
import mongoose from "mongoose";

/**
 * Estado global del consumer de Kafka
 * Se actualiza desde consumer.js cuando conecta/desconecta
 */
let kafkaConsumerConnected = false;

export function setKafkaConsumerStatus(connected) {
  kafkaConsumerConnected = connected;
}

export function getKafkaConsumerStatus() {
  return kafkaConsumerConnected;
}

/**
 * Verifica la conexión a MySQL
 * @returns {Promise<{ok: boolean, latency?: number, error?: string}>}
 */
export async function checkMySQL() {
  const start = Date.now();
  try {
    if (!mysqlPool) {
      return { ok: false, error: "Pool no inicializado" };
    }
    
    await mysqlPool.query("SELECT 1");
    const latency = Date.now() - start;
    
    return { ok: true, latency };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Verifica la conexión a MongoDB
 * @returns {Promise<{ok: boolean, state?: string, error?: string}>}
 */
export async function checkMongoDB() {
  try {
    if (!mongoose.connection) {
      return { ok: false, error: "Conexión no inicializada" };
    }

    const state = mongoose.connection.readyState;
    
    // 0 = desconectado, 1 = conectado, 2 = conectando, 3 = desconectando
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };

    const isConnected = state === 1;
    
    return {
      ok: isConnected,
      state: stateMap[state] || "unknown",
      readyState: state
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Verifica el estado del Kafka Consumer
 * @returns {{ok: boolean, status: string}}
 */
export function checkKafkaConsumer() {
  return {
    ok: kafkaConsumerConnected,
    status: kafkaConsumerConnected ? "connected" : "disconnected"
  };
}

/**
 * Ejecuta todos los health checks
 * @returns {Promise<{ok: boolean, timestamp: number, checks: object}>}
 */
export async function performHealthCheck() {
  const timestamp = Date.now();
  
  const [mysql, mongodb] = await Promise.all([
    checkMySQL(),
    checkMongoDB()
  ]);
  
  const kafkaConsumer = checkKafkaConsumer();
  
  // El sistema está OK si al menos MySQL y Kafka Consumer están conectados
  // MongoDB es opcional (puede no estar configurado)
  const isHealthy = mysql.ok && kafkaConsumer.ok;
  
  return {
    ok: isHealthy,
    timestamp,
    uptime: process.uptime(),
    checks: {
      mysql,
      mongodb,
      kafkaConsumer
    }
  };
}

/**
 * Versión simplificada para readiness probe
 * Solo verifica dependencias críticas
 */
export async function performReadinessCheck() {
  const mysql = await checkMySQL();
  const kafkaConsumer = checkKafkaConsumer();
  
  const ready = mysql.ok && kafkaConsumer.ok;
  
  return {
    ready,
    timestamp: Date.now(),
    critical: {
      mysql: mysql.ok,
      kafkaConsumer: kafkaConsumer.ok
    }
  };
}
