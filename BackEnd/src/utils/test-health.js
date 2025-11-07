// test-health.js - Script para probar los endpoints de health
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 4000}`;

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const status = response.status === 200 ? "✅" : "❌";
    console.log(`${status} ${name} (${response.status})`);
    console.log(JSON.stringify(data, null, 2));
    console.log("");
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    console.log("");
  }
}

async function runTests() {
  console.log("🔍 Probando endpoints de health...\n");
  console.log("═".repeat(60));
  console.log("");

  await testEndpoint("Health Check Completo", `${BASE_URL}/api/health`);
  await testEndpoint("Readiness Check", `${BASE_URL}/api/health/ready`);
  await testEndpoint("Liveness Check", `${BASE_URL}/api/health/live`);
  await testEndpoint("Metrics", `${BASE_URL}/api/health/metrics`);
  
  console.log("═".repeat(60));
  console.log("\n✨ Tests completados\n");
}

runTests().catch(console.error);
