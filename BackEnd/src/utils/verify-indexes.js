// verify-indexes.js - Script para verificar índices SQL y rendimiento
import { pool } from "../config/db_mysql.js";

export async function verifyIndexes() {
  console.log("\n🔍 Verificando índices SQL...\n");

  const tables = ["air_quality", "noise", "underground"];
  
  for (const table of tables) {
    console.log(`📊 Tabla: ${table}`);
    console.log("─".repeat(60));

    // Mostrar índices de la tabla
    const [indexes] = await pool.query(`SHOW INDEX FROM ${table}`);
    
    const indexNames = [...new Set(indexes.map(i => i.Key_name))];
    console.log(`✅ Índices encontrados (${indexNames.length}):`);
    indexNames.forEach(name => {
      const cols = indexes
        .filter(i => i.Key_name === name)
        .map(i => i.Column_name)
        .join(", ");
      console.log(`   • ${name}: (${cols})`);
    });

    // Contar registros
    const [count] = await pool.query(`SELECT COUNT(*) as total FROM ${table}`);
    console.log(`📈 Registros: ${count[0].total.toLocaleString()}`);
    console.log("");
  }
}

export async function testQueryPerformance() {
  console.log("\n⚡ Probando rendimiento de consultas...\n");

  const queries = [
    {
      name: "Consulta por rango de tiempo",
      sql: `EXPLAIN SELECT * FROM air_quality 
            WHERE time BETWEEN '2024-01-01' AND '2024-12-31' 
            LIMIT 100`
    },
    {
      name: "Consulta por devEui",
      sql: `EXPLAIN SELECT * FROM air_quality 
            WHERE devEui = 'test-device-001' 
            LIMIT 100`
    },
    {
      name: "Consulta compuesta (tiempo + devEui)",
      sql: `EXPLAIN SELECT * FROM air_quality 
            WHERE time BETWEEN '2024-01-01' AND '2024-12-31' 
            AND devEui = 'test-device-001' 
            LIMIT 100`
    }
  ];

  for (const q of queries) {
    console.log(`🔎 ${q.name}`);
    console.log("─".repeat(60));
    
    try {
      const [result] = await pool.query(q.sql);
      
      if (result.length > 0) {
        const explain = result[0];
        console.log(`   Type: ${explain.type || 'N/A'}`);
        console.log(`   Key: ${explain.key || 'NULL (sin índice)'}`);
        console.log(`   Rows: ${explain.rows || 'N/A'}`);
        console.log(`   Extra: ${explain.Extra || 'N/A'}`);
        
        // Verificar si usa índice
        if (explain.key) {
          console.log(`   ✅ Usa índice: ${explain.key}`);
        } else {
          console.log(`   ⚠️  NO usa índice (escaneo completo de tabla)`);
        }
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
    
    console.log("");
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await verifyIndexes();
    await testQueryPerformance();
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
}
