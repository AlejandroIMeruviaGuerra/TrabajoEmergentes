// src/kafka/consumer.js
import { Kafka, logLevel } from "kafkajs";
import { ingestRecord, setIO as setIOIngest } from "../services/ingest.service.js";
import { pool } from "../config/db_mysql.js";
import { setKafkaConsumerStatus } from "../utils/health.js";
import { consumerMetrics } from "./metrics.js";
import {
  airCrudeSchema,
  noiseCrudeSchema,
  undergroundCrudeSchema,
  airAggregatedSchema,
  noiseAggregatedSchema,
  undergroundAggregatedSchema,
  validateData
} from "./schemas/sensor.schemas.js";

let kafka = null;
let consumer = null;
let io = null;

const BROKERS = (process.env.KAFKA_BROKERS || "host.docker.internal:9092").split(",");

export function setSocketIO(ioInstance) {
  io = ioInstance;
  setIOIngest(ioInstance);
}

export async function startConsumer() {
  kafka = new Kafka({
    clientId: "emergentes-consumer",
    brokers: BROKERS,
    logLevel: logLevel.ERROR,
    retry: { initialRetryTime: 300, retries: 10 },
  });

  consumer = kafka.consumer({
    groupId: "grupo-sensores-v2",
    sessionTimeout: 30000,
  });

  await consumer.connect();
  console.log("✅ Kafka consumer conectado");
  setKafkaConsumerStatus(true); // Actualizar estado para health check

  // Crudos
  await consumer.subscribe({ topic: "sensores.air", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.noise", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.underground", fromBeginning: false });

  // Agregados 1m (salida de Kafka Streams)
  await consumer.subscribe({ topic: "sensores.air.avg1m", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.noise.avg1m", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.underground.avg1m", fromBeginning: false });

  console.log("✅ Kafka consumer suscrito a crudos y agregados (avg1m)");

  await consumer.run({
    eachMessage: async ({ topic, message, partition }) => {
      const startTime = Date.now();
      
      try {
        const key = message.key?.toString() || null;
        const payload = JSON.parse(message.value.toString());

        // Métricas avanzadas: registrar tamaño del mensaje
        const messageSize = message.value.length;
        consumerMetrics.recordMessageSize(messageSize);
        
        // Métricas avanzadas: registrar timestamp para throughput
        consumerMetrics.recordMessageTimestamp(topic);

        // 1) Crudos → validar y procesar
        if (topic === "sensores.air" || topic === "sensores.noise" || topic === "sensores.underground") {
          const type = topic.split(".")[1]; // air | noise | underground
          
          // Seleccionar schema según tipo
          let schema;
          if (type === "air") schema = airCrudeSchema;
          else if (type === "noise") schema = noiseCrudeSchema;
          else if (type === "underground") schema = undergroundCrudeSchema;
          
          // Validar payload
          const validation = validateData(payload, schema);
          
          if (!validation.valid) {
            console.error(`❌ Validación fallida para ${topic}:`, validation.errors);
            consumerMetrics.recordError(topic);
            return; // Descartar mensaje inválido
          }
          
          // Procesar con datos validados
          await ingestRecord(type, validation.value);
          
          // Registrar métricas exitosas
          const processingTime = Date.now() - startTime;
          consumerMetrics.recordMessage(topic, processingTime);
          consumerMetrics.recordLatency(processingTime); // Métrica avanzada
          return;
        }

        // 2) Agregados → validar y guardar en *_agg_1m y emitir evento específico
        if (topic === "sensores.air.avg1m") {
          // Validar payload agregado
          const validation = validateData(payload, airAggregatedSchema);
          
          if (!validation.valid) {
            console.error(`❌ Validación fallida para ${topic}:`, validation.errors);
            consumerMetrics.recordError(topic);
            return; // Descartar mensaje inválido
          }
          
          const validPayload = validation.value;
          
          // Calcular promedios con datos validados
          const co2 = validPayload.sum_co2 / validPayload.count;
          const temperature = validPayload.sum_temperature / validPayload.count;
          const humidity = validPayload.sum_humidity / validPayload.count;
          // const voc = validPayload.sum_voc / validPayload.count;
          // FIX: prevenir NaN aunque no exista sum_voc
const voc = validPayload.sum_voc
  ? validPayload.sum_voc / validPayload.count
  : 0;

          const ts = new Date();

          await pool.query(
            `INSERT INTO air_quality_agg_1m
               (devEui, ts_window, location_name, co2_avg, temperature_avg, humidity_avg, voc_avg, count)
             VALUES (?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               location_name=VALUES(location_name),
               co2_avg=VALUES(co2_avg),
               temperature_avg=VALUES(temperature_avg),
               humidity_avg=VALUES(humidity_avg),
               voc_avg=VALUES(voc_avg),
               count=VALUES(count)`,
            [key, ts, validPayload.locationName ?? null, co2, temperature, humidity, voc, validPayload.count]
          );

          io?.emit("air:avg1m", { devEui: key, co2, temperature, humidity, voc, count: validPayload.count, at: ts });
          
          // Registrar métricas exitosas
          const processingTime = Date.now() - startTime;
          consumerMetrics.recordMessage(topic, processingTime);
          consumerMetrics.recordLatency(processingTime); // Métrica avanzada
          return;
        }

        if (topic === "sensores.noise.avg1m") {
          // Validar payload agregado
          const validation = validateData(payload, noiseAggregatedSchema);
          
          if (!validation.valid) {
            console.error(`❌ Validación fallida para ${topic}:`, validation.errors);
            consumerMetrics.recordError(topic);
            return; // Descartar mensaje inválido
          }
          
          const validPayload = validation.value;
          
          // Calcular promedios con datos validados
          const laeq = validPayload.sum_laeq / validPayload.count;
          const lai  = validPayload.sum_lai  / validPayload.count;
          const laimax = validPayload.sum_laimax / validPayload.count;
          const ts = new Date();

          await pool.query(
            `INSERT INTO noise_agg_1m
               (devEui, ts_window, location_name, laeq_avg, lai_avg, laimax_avg, count)
             VALUES (?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               location_name=VALUES(location_name),
               laeq_avg=VALUES(laeq_avg),
               lai_avg=VALUES(lai_avg),
               laimax_avg=VALUES(laimax_avg),
               count=VALUES(count)`,
            [key, ts, validPayload.locationName ?? null, laeq, lai, laimax, validPayload.count]
          );

          io?.emit("noise:avg1m", { devEui: key, laeq, lai, laimax, count: validPayload.count, at: ts });
          
          const processingTime = Date.now() - startTime;
          consumerMetrics.recordMessage(topic, processingTime);
          consumerMetrics.recordLatency(processingTime); // Métrica avanzada
          return;
        }

        if (topic === "sensores.underground.avg1m") {
          // Validar payload con undergroundAggregatedSchema
          const validation = validateData(payload, undergroundAggregatedSchema);
          
          if (!validation.valid) {
            console.error(`[CONSUMER] Validación fallida para ${topic}, key=${key}:`, validation.errors);
            consumerMetrics.recordError(topic);
            return; // Descartar mensaje inválido
          }
          
          const validPayload = validation.value;
          const distance = validPayload.sum_distance / validPayload.count;
          const ts = new Date();

          await pool.query(
            `INSERT INTO underground_agg_1m
               (devEui, ts_window, location_name, distance_avg, count)
             VALUES (?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               location_name=VALUES(location_name),
               distance_avg=VALUES(distance_avg),
               count=VALUES(count)`,
            [key, ts, validPayload.locationName ?? null, distance, validPayload.count]
          );

          io?.emit("underground:avg1m", { devEui: key, distance, count: validPayload.count, at: ts });
          
          const processingTime = Date.now() - startTime;
          consumerMetrics.recordMessage(topic, processingTime);
          consumerMetrics.recordLatency(processingTime); // Métrica avanzada
          return;
        }

      } catch (e) {
        console.error("❌ Kafka eachMessage:", e.message);
        consumerMetrics.recordError(topic);
      }
    },
  });

  // Manejadores de eventos para health monitoring
  consumer.on(consumer.events.DISCONNECT, () => {
    console.log("🔴 Kafka consumer desconectado");
    setKafkaConsumerStatus(false);
  });

  consumer.on(consumer.events.CONNECT, () => {
    console.log("🟢 Kafka consumer reconectado");
    setKafkaConsumerStatus(true);
  });

  consumer.on(consumer.events.CRASH, ({ error }) => {
    console.error("💥 Kafka consumer crash:", error.message);
    setKafkaConsumerStatus(false);
  });
}

/**
 * Detener el consumer gracefully
 */
export async function stopConsumer() {
  if (consumer) {
    try {
      await consumer.disconnect();
      setKafkaConsumerStatus(false);
      console.log("✅ Kafka consumer desconectado correctamente");
    } catch (e) {
      console.error("❌ Error al desconectar consumer:", e.message);
    }
  }
}

/**
 * Obtener métricas del consumer (básicas)
 */
export function getConsumerMetrics() {
  return consumerMetrics.getMetrics();
}

/**
 * Obtener métricas avanzadas del consumer
 */
export function getAdvancedConsumerMetrics() {
  return consumerMetrics.getAllMetrics();
}
