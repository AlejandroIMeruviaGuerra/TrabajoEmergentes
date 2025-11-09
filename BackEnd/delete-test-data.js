// Script para borrar datos de prueba de MySQL
import { pool } from './src/config/db_mysql.js';

async function deleteTestData() {
  const connection = await pool.getConnection();

  console.log('✅ Conectado a MySQL');

  try {
    // Borrar air_quality
    const [airResult] = await connection.execute(
      "DELETE FROM air_quality WHERE devEui LIKE 'eui-000000000000000%' OR devEui IS NULL"
    );
    console.log(`🗑️  air_quality: ${airResult.affectedRows} registros eliminados`);

    // Borrar noise
    const [noiseResult] = await connection.execute(
      "DELETE FROM noise WHERE devEui LIKE 'eui-000000000000000%' OR devEui IS NULL"
    );
    console.log(`🗑️  noise: ${noiseResult.affectedRows} registros eliminados`);

    // Borrar underground
    const [undergroundResult] = await connection.execute(
      "DELETE FROM underground WHERE devEui LIKE 'eui-000000000000000%' OR devEui IS NULL"
    );
    console.log(`🗑️  underground: ${undergroundResult.affectedRows} registros eliminados`);

    // Verificar conteos finales
    console.log('\n📊 Conteo final:');
    const [airCount] = await connection.execute('SELECT COUNT(*) as count FROM air_quality');
    console.log(`   air_quality: ${airCount[0].count} registros`);

    const [noiseCount] = await connection.execute('SELECT COUNT(*) as count FROM noise');
    console.log(`   noise: ${noiseCount[0].count} registros`);

    const [undergroundCount] = await connection.execute('SELECT COUNT(*) as count FROM underground');
    console.log(`   underground: ${undergroundCount[0].count} registros`);

    console.log('\n✅ Datos de prueba eliminados correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

deleteTestData();
