// src/workers/ingest-trigger.js
import { spawn } from "child_process";
import path from "path";

/**
 * Ejecuta el JAR del ingestor Java para el tipo y archivo especificado.
 * @param {"air"|"noise"|"underground"} sensorType 
 * @param {string} filePath Ruta absoluta del CSV ensamblado
 */
export function triggerIngestor(sensorType, filePath) {
  return new Promise((resolve, reject) => {
    // Ruta del JAR (usa ENV si existe, si no, esta por defecto)
    const JAR_PATH =
      process.env.INGEST_JAR_PATH ||
      "C:/Machine Learning/TrabajoEmergentes/ingestor-java/target/ingestor-1.0.0-jar-with-dependencies.jar";

    const JAVA_PATH = process.env.JAVA_PATH || "java";
    const brokers = process.env.KAFKA_BROKERS || "localhost:9092";

    const envVarMap = {
      air: "CSV_AIR",
      noise: "CSV_NOISE",
      underground: "CSV_UND",
    };

    const csvEnvKey = envVarMap[sensorType];
    if (!csvEnvKey) {
      return reject(new Error(`Tipo inválido: ${sensorType}`));
    }

    const env = {
      ...process.env,
      KAFKA_BROKERS: brokers,
      [csvEnvKey]: path.resolve(filePath),
    };

    console.log(`🚀 [Ingestor] Ejecutando Java para ${sensorType}`);
    console.log(`   Archivo: ${filePath}`);
    console.log(`   Brokers: ${brokers}`);
    console.log(`   Jar: ${JAR_PATH}`);

    const proc = spawn(JAVA_PATH, ["-jar", JAR_PATH], {
      env,
      stdio: "inherit", // se ve toda la salida del JAR en la consola del backend
    });

    proc.on("error", (err) => {
      console.error("❌ Error al lanzar Ingestor:", err);
      reject(err);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Ingestor finalizado correctamente (${sensorType})`);
        resolve();
      } else {
        console.error(`⚠️ Ingestor terminó con código ${code}`);
        reject(new Error(`Ingestor terminó con código ${code}`));
      }
    });
  });
}
