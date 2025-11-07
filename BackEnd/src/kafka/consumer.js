// src/kafka/consumer.js
import { Kafka, logLevel } from "kafkajs";
import { ingestRecord, setIO as setIOIngest } from "../services/ingest.service.js";
import { pool } from "../config/db_mysql.js";

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
    groupId: "grupo-sensores",
    sessionTimeout: 30000,
  });

  await consumer.connect();

  // Crudos
  await consumer.subscribe({ topic: "sensores.air", fromBeginning: true });
  await consumer.subscribe({ topic: "sensores.noise", fromBeginning: true });
  await consumer.subscribe({ topic: "sensores.underground", fromBeginning: true });

  // Agregados 1m (salida de Kafka Streams)
  await consumer.subscribe({ topic: "sensores.air.avg1m", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.noise.avg1m", fromBeginning: false });
  await consumer.subscribe({ topic: "sensores.underground.avg1m", fromBeginning: false });

  console.log("✅ Kafka consumer suscrito a crudos y agregados (avg1m)");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const key = message.key?.toString() || null;
        const payload = JSON.parse(message.value.toString());

        // 1) Crudos → usa tu pipeline actual
        if (topic === "sensores.air" || topic === "sensores.noise" || topic === "sensores.underground") {
          const type = topic.split(".")[1]; // air | noise | underground
          await ingestRecord(type, payload);
          return;
        }

        // 2) Agregados → guardar en *_agg_1m y emitir evento específico
        if (topic === "sensores.air.avg1m") {
          // Esperado desde Streams: { sum_co2,sum_t,sum_h,sum_p,count,locationName? }
          const co2 = payload.sum_co2 / payload.count;
          const temperature = payload.sum_t / payload.count;
          const humidity = payload.sum_h / payload.count;
          const pressure = payload.sum_p / payload.count;
          const ts = new Date();

          await pool.query(
            `INSERT INTO air_quality_agg_1m
               (devEui, ts_window, location_name, co2_avg, temperature_avg, humidity_avg, pressure_avg, count)
             VALUES (?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               location_name=VALUES(location_name),
               co2_avg=VALUES(co2_avg),
               temperature_avg=VALUES(temperature_avg),
               humidity_avg=VALUES(humidity_avg),
               pressure_avg=VALUES(pressure_avg),
               count=VALUES(count)`,
            [key, ts, payload.locationName ?? null, co2, temperature, humidity, pressure, payload.count]
          );

          io?.emit("air:avg1m", { devEui: key, co2, temperature, humidity, pressure, count: payload.count, at: ts });
          return;
        }

        if (topic === "sensores.noise.avg1m") {
          // { sum_laeq,sum_lai,sum_laimax,count,locationName? }
          const laeq = payload.sum_laeq / payload.count;
          const lai  = payload.sum_lai  / payload.count;
          const laimax = payload.sum_laimax / payload.count;
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
            [key, ts, payload.locationName ?? null, laeq, lai, laimax, payload.count]
          );

          io?.emit("noise:avg1m", { devEui: key, laeq, lai, laimax, count: payload.count, at: ts });
          return;
        }

        if (topic === "sensores.underground.avg1m") {
          // { sum_distance,count,locationName? }
          const distance = payload.sum_distance / payload.count;
          const ts = new Date();

          await pool.query(
            `INSERT INTO underground_agg_1m
               (devEui, ts_window, location_name, distance_avg, count)
             VALUES (?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               location_name=VALUES(location_name),
               distance_avg=VALUES(distance_avg),
               count=VALUES(count)`,
            [key, ts, payload.locationName ?? null, distance, payload.count]
          );

          io?.emit("underground:avg1m", { devEui: key, distance, count: payload.count, at: ts });
          return;
        }

      } catch (e) {
        console.error("❌ Kafka eachMessage:", e.message);
      }
    },
  });
}
