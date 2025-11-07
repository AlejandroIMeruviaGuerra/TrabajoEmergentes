// scripts/test-consumer-metrics.js
/**
 * Script de prueba para verificar el endpoint de métricas del consumer
 * 
 * Uso:
 *   node scripts/test-consumer-metrics.js
 * 
 * Requisitos:
 *   - Backend corriendo en http://localhost:4000
 *   - Consumer activo procesando mensajes
 */

const http = require("http");

const BACKEND_URL = "http://localhost:4000";
const ENDPOINTS = [
  "/api/health",
  "/api/health/ready",
  "/api/health/live",
  "/api/health/metrics",
  "/api/health/consumer"  // ← Nuevo endpoint
];

/**
 * Realizar petición HTTP GET
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 4000,
      path: path,
      method: "GET",
      headers: { "Accept": "application/json" }
    };

    const req = http.request(options, (res) => {
      let data = "";
      
      res.on("data", (chunk) => {
        data += chunk;
      });
      
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: json });
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * Formatear JSON con colores
 */
function formatJSON(obj, indent = 0) {
  const spaces = " ".repeat(indent);
  
  if (typeof obj !== "object" || obj === null) {
    return String(obj);
  }
  
  if (Array.isArray(obj)) {
    return `[${obj.map(item => formatJSON(item, indent + 2)).join(", ")}]`;
  }
  
  const entries = Object.entries(obj).map(([key, value]) => {
    const formattedValue = typeof value === "object" && value !== null
      ? formatJSON(value, indent + 2)
      : JSON.stringify(value);
    return `${spaces}  "${key}": ${formattedValue}`;
  });
  
  return `{\n${entries.join(",\n")}\n${spaces}}`;
}

/**
 * Test principal
 */
async function runTests() {
  console.log("🧪 Testing Consumer Metrics Endpoints\n");
  console.log("=" .repeat(60));
  
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`\n📍 Testing: ${endpoint}`);
      console.log("-".repeat(60));
      
      const { statusCode, body } = await makeRequest(endpoint);
      
      // Status code
      const statusEmoji = statusCode === 200 ? "✅" : 
                         statusCode === 503 ? "⚠️" : "❌";
      console.log(`${statusEmoji} Status: ${statusCode}`);
      
      // Endpoint específico: /api/health/consumer
      if (endpoint === "/api/health/consumer") {
        console.log("\n📊 Consumer Metrics:");
        console.log(formatJSON(body, 0));
        
        // Validaciones
        console.log("\n🔍 Validations:");
        
        const hasTimestamp = "timestamp" in body;
        console.log(`  ${hasTimestamp ? "✅" : "❌"} Has timestamp`);
        
        const hasUptime = "uptime" in body;
        console.log(`  ${hasUptime ? "✅" : "❌"} Has uptime`);
        
        const hasMessagesProcessed = "messagesProcessed" in body;
        console.log(`  ${hasMessagesProcessed ? "✅" : "❌"} Has messagesProcessed`);
        
        const hasErrors = "errors" in body;
        console.log(`  ${hasErrors ? "✅" : "❌"} Has errors`);
        
        const hasTotalMessages = "totalMessagesProcessed" in body;
        console.log(`  ${hasTotalMessages ? "✅" : "❌"} Has totalMessagesProcessed`);
        
        const hasTotalErrors = "totalErrors" in body;
        console.log(`  ${hasTotalErrors ? "✅" : "❌"} Has totalErrors`);
        
        const hasAvgProcessingTime = "averageProcessingTimeMs" in body;
        console.log(`  ${hasAvgProcessingTime ? "✅" : "❌"} Has averageProcessingTimeMs`);
        
        const hasMessagesPerSecond = "messagesPerSecond" in body;
        console.log(`  ${hasMessagesPerSecond ? "✅" : "❌"} Has messagesPerSecond`);
        
        // Verificar topics esperados
        if (hasMessagesProcessed) {
          const expectedTopics = [
            "sensores.air.crude",
            "sensores.noise.crude",
            "sensores.underground.crude",
            "sensores.air.avg1m",
            "sensores.noise.avg1m",
            "sensores.underground.avg1m"
          ];
          
          console.log("\n🎯 Topics Coverage:");
          for (const topic of expectedTopics) {
            const exists = topic in body.messagesProcessed;
            console.log(`  ${exists ? "✅" : "❌"} ${topic}`);
          }
        }
        
        // Resumen numérico
        if (hasTotalMessages) {
          console.log("\n📈 Summary:");
          console.log(`  Total Messages: ${body.totalMessagesProcessed}`);
          console.log(`  Total Errors: ${body.totalErrors}`);
          console.log(`  Avg Processing: ${body.averageProcessingTimeMs?.toFixed(2) || 0} ms`);
          console.log(`  Throughput: ${body.messagesPerSecond?.toFixed(2) || 0} msg/s`);
          console.log(`  Uptime: ${body.uptime || "N/A"}`);
        }
      } else {
        // Otros endpoints: mostrar solo keys principales
        console.log("\n📦 Response Keys:");
        console.log(`  ${Object.keys(body).join(", ")}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      
      if (error.message.includes("ECONNREFUSED")) {
        console.log("\n⚠️  Backend no está corriendo. Inicia el servidor:");
        console.log("   cd BackEnd && npm run dev");
        break;
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("🏁 Tests completed\n");
}

// Ejecutar tests
runTests().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(1);
});
