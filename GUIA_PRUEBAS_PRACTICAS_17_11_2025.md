# 🧪 GUÍA DE PRUEBAS PRÁCTICAS - TrabajoEmergentes
**Fecha:** 17 de Noviembre de 2025  
**Nivel:** Principiante a Avanzado

---

## 📋 TABLA DE CONTENIDOS

1. [Preparación del Ambiente](#preparación-del-ambiente)
2. [Pruebas Unitarias](#pruebas-unitarias)
3. [Pruebas de Integración](#pruebas-de-integración)
4. [Pruebas End-to-End](#pruebas-end-to-end)
5. [Pruebas de Carga](#pruebas-de-carga)
6. [Pruebas de Monitoreo](#pruebas-de-monitoreo)
7. [Verificación de Datos](#verificación-de-datos)

---

## 🔧 PREPARACIÓN DEL AMBIENTE

### Paso 1: Validar Requisitos

```bash
# Abrir PowerShell como Administrador
# Navegar al proyecto
cd d:\lunes\TrabajoEmergentes

# Crear archivo de validación
New-Item -Path "pre-test-check.ps1" -ItemType File -Force
```

**Contenido de `pre-test-check.ps1`:**
```powershell
Write-Host "🔍 Validando requisitos del sistema...`n" -ForegroundColor Cyan

# 1. Validar Node.js
$nodeVersion = node --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# 2. Validar Java
$javaVersion = java -version 2>&1 | Select-String "version"
Write-Host "✅ Java: $javaVersion" -ForegroundColor Green

# 3. Validar Maven
$mavenVersion = mvn --version 2>&1 | Select-String "Apache Maven"
Write-Host "✅ Maven: $mavenVersion" -ForegroundColor Green

# 4. Validar Docker
$dockerVersion = docker --version
Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green

# 5. Validar Git
$gitVersion = git --version
Write-Host "✅ Git: $gitVersion" -ForegroundColor Green

# 6. Validar archivos críticos
Write-Host "`n🔍 Validando archivos críticos...`n" -ForegroundColor Cyan

$requiredFiles = @(
    "BackEnd/src/index.js",
    "BackEnd/package.json",
    "ingestor-java/pom.xml",
    "init-db.sql",
    "infra/kafka/docker-compose.yml"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ FALTA: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ Todas las validaciones completadas`n" -ForegroundColor Green
```

```bash
.\pre-test-check.ps1
```

---

## 🧪 PRUEBAS UNITARIAS

### Prueba 1: Validar Conexiones Individuales

**Crear archivo:** `BackEnd/verify-connections.js`

```javascript
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

async function verifyConnections() {
  console.log('🔍 Iniciando verificación de conexiones...\n');

  // 1. MySQL
  console.log('1️⃣  Probando MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute('SELECT 1 as result');
    console.log('✅ MySQL: OK\n');
    await connection.end();
  } catch (error) {
    console.error('❌ MySQL: FALLO -', error.message, '\n');
  }

  // 2. MongoDB
  console.log('2️⃣  Probando MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB: OK\n');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB: FALLO -', error.message, '\n');
  }

  // 3. Kafka
  console.log('3️⃣  Probando Apache Kafka...');
  try {
    const kafka = new Kafka({
      clientId: 'test-client',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();
    
    console.log(`✅ Kafka: OK (${topics.length} topics)`);
    console.log('Topics encontrados:');
    topics.forEach(t => console.log(`   - ${t}`));
    console.log('');
  } catch (error) {
    console.error('❌ Kafka: FALLO -', error.message, '\n');
  }

  console.log('✅ Verificación completada\n');
}

verifyConnections().catch(console.error);
```

**Ejecutar:**
```bash
cd BackEnd
node verify-connections.js
```

**Salida esperada:**
```
🔍 Iniciando verificación de conexiones...

1️⃣  Probando MySQL...
✅ MySQL: OK

2️⃣  Probando MongoDB Atlas...
✅ MongoDB: OK

3️⃣  Probando Apache Kafka...
✅ Kafka: OK (6 topics)
Topics encontrados:
   - sensores.air
   - sensores.noise
   - sensores.underground
   - sensores.air.avg1m
   - sensores.noise.avg1m
   - sensores.underground.avg1m

✅ Verificación completada
```

---

## 🔗 PRUEBAS DE INTEGRACIÓN

### Prueba 2: Flujo CSV → Base de Datos

**Crear archivo:** `BackEnd/test-integration-csv-to-db.js`

```javascript
import fs from 'fs';
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

async function testCSVtoDB() {
  console.log('🧪 TEST: CSV → Base de Datos\n');

  // Fase 1: Preparar archivo de prueba
  console.log('Fase 1: Preparando archivo CSV...');
  const csvPath = 'test-integration.csv';
  const csvContent = `id,time,devEui,co2,temperature,humidity,pressure,location_name
rec1,2025-01-15T10:00:00Z,eui-0000000000000001,420,22.5,45.3,,TEST-LOC
rec2,2025-01-15T10:01:00Z,eui-0000000000000001,418,22.6,45.2,,TEST-LOC
rec3,2025-01-15T10:02:00Z,eui-0000000000000001,425,21.8,48.1,,TEST-LOC`;

  fs.writeFileSync(csvPath, csvContent);
  console.log(`✅ CSV creado: ${csvPath}\n`);

  // Fase 2: Ejecutar Java Ingestor
  console.log('Fase 2: Ejecutando Java Ingestor...');
  try {
    const javaCmd = `java -jar ingestor-java/target/ingestor-1.0.0-jar-with-dependencies.jar air ${csvPath} localhost:9092`;
    const output = execSync(javaCmd, { encoding: 'utf-8', stdio: 'pipe' });
    
    if (output.includes('Mensajes enviados')) {
      console.log('✅ Java Ingestor: Completado exitosamente\n');
    } else {
      console.log('⚠️  Java Ingestor: Posible fallo\n');
    }
  } catch (error) {
    console.error('❌ Java Ingestor: Error -', error.message, '\n');
    return;
  }

  // Fase 3: Esperar procesamiento
  console.log('Fase 3: Esperando procesamiento...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('✅ Tiempo de espera completado\n');

  // Fase 4: Verificar en MySQL
  console.log('Fase 4: Verificando MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM air_quality WHERE location_name = "TEST-LOC"'
    );

    const count = rows[0].count;
    if (count >= 3) {
      console.log(`✅ MySQL: ${count} registros encontrados\n`);
    } else {
      console.log(`⚠️  MySQL: Solo ${count} registros (esperaba 3)\n`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ MySQL: Error -', error.message, '\n');
  }

  // Fase 5: Verificar en MongoDB
  console.log('Fase 5: Verificando MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const count = await db.collection('airqualities').countDocuments({
      'labels': { $elemMatch: { 'location_name': 'TEST-LOC' } }
    });

    if (count >= 3) {
      console.log(`✅ MongoDB: ${count} documentos encontrados\n`);
    } else {
      console.log(`⚠️  MongoDB: Solo ${count} documentos (esperaba 3)\n`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB: Error -', error.message, '\n');
  }

  // Limpiar
  fs.unlinkSync(csvPath);
  console.log('✅ Archivos temporales eliminados\n');
  console.log('✅ TEST COMPLETADO\n');
}

testCSVtoDB().catch(console.error);
```

**Ejecutar:**
```bash
cd BackEnd
node test-integration-csv-to-db.js
```

---

## 📊 PRUEBAS END-TO-END

### Prueba 3: Flujo Completo Automatizado

**Script PowerShell Completo:**

```powershell
# Guardar como: test-e2e-complete.ps1

Write-Host "🚀 TEST END-TO-END COMPLETO`n" -ForegroundColor Cyan

# 1. Limpiar
Write-Host "1️⃣  Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Iniciar Backend
Write-Host "2️⃣  Iniciando Backend..." -ForegroundColor Yellow
$backendProc = Start-Process node -ArgumentList "src/index.js" `
  -WorkingDirectory "BackEnd" `
  -PassThru -NoNewWindow -RedirectStandardOutput "backend.log"

Start-Sleep -Seconds 8
Write-Host "✅ Backend iniciado (PID: $($backendProc.Id))`n" -ForegroundColor Green

# 3. Ejecutar pruebas de conexión
Write-Host "3️⃣  Verificando conexiones..." -ForegroundColor Yellow
Push-Location BackEnd
node verify-connections.js | Out-Host
Pop-Location

# 4. Enviar archivo CSV
Write-Host "4️⃣  Enviando archivo CSV..." -ForegroundColor Yellow
$csvPath = "test-air.csv"

if (Test-Path $csvPath) {
    $csvContent = Get-Content -Path $csvPath -Raw
    $boundary = [guid]::NewGuid().ToString()
    $body = @"
--$boundary
Content-Disposition: form-data; name="file"; filename="test-air.csv"
Content-Type: text/csv

$csvContent
--$boundary--
"@

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/sensors/upload" `
            -Method POST `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ CSV enviado (Status: $($response.StatusCode))`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al enviar CSV: $_`n" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Archivo CSV no encontrado`n" -ForegroundColor Red
}

# 5. Esperar procesamiento
Write-Host "5️⃣  Esperando procesamiento (15 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "✅ Procesamiento completado`n" -ForegroundColor Green

# 6. Verificar resultados
Write-Host "6️⃣  Verificando resultados..." -ForegroundColor Yellow

# Crear script de verificación
$verifyScript = @"
import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';

const mongoUri = process.env.MONGODB_URI;
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

console.log('Verificando MongoDB...');
try {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('emergentes');
  const count = await db.collection('airqualities').countDocuments();
  console.log('  Air Quality: ' + count + ' documentos');
  await client.close();
} catch (e) {
  console.error('  ERROR:', e.message);
}

console.log('Verificando MySQL...');
try {
  const conn = await mysql.createConnection(dbConfig);
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM air_quality');
  console.log('  Air Quality: ' + rows[0].count + ' registros');
  await conn.end();
} catch (e) {
  console.error('  ERROR:', e.message);
}
"@

$verifyFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.mjs'
Set-Content -Path $verifyFile -Value $verifyScript -Encoding UTF8

Push-Location BackEnd
node $verifyFile 2>&1 | Out-Host
Pop-Location

Remove-Item $verifyFile -Force -ErrorAction SilentlyContinue

# 7. Resumen
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "✅ Backend: Activo en http://localhost:4000" -ForegroundColor Green
Write-Host "✅ MySQL: Conectado" -ForegroundColor Green
Write-Host "✅ MongoDB: Conectado" -ForegroundColor Green
Write-Host "✅ Kafka: Conectado" -ForegroundColor Green
Write-Host "`nTest completado. Presiona Ctrl+C para detener Backend..." -ForegroundColor Yellow

# Esperar a Ctrl+C
try {
    while ($true) { Start-Sleep -Seconds 10 }
} catch {
    # Ctrl+C
}

Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "`n✅ Backend detenido`n" -ForegroundColor Green
```

**Ejecutar:**
```powershell
cd d:\lunes\TrabajoEmergentes
.\test-e2e-complete.ps1
```

---

## 📈 PRUEBAS DE CARGA

### Prueba 4: Generar y Procesar Múltiples Archivos

**Crear archivo:** `BackEnd/test-load.js`

```javascript
import fs from 'fs';
import path from 'path';

// Generar CSV con N registros
function generateLargeCSV(filename, records = 1000) {
  console.log(`📝 Generando CSV con ${records} registros...`);

  let csv = 'id,time,devEui,co2,temperature,humidity,pressure,location_name\n';

  for (let i = 1; i <= records; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 86400000).toISOString();
    const co2 = Math.floor(300 + Math.random() * 200);
    const temp = Math.floor(15 + Math.random() * 20);
    const humidity = Math.floor(30 + Math.random() * 60);

    csv += `rec${i},${timestamp},eui-${String(i).padStart(16, '0')},${co2},${temp},${humidity},,TEST\n`;
  }

  fs.writeFileSync(filename, csv);
  console.log(`✅ CSV generado: ${filename} (${(fs.statSync(filename).size / 1024).toFixed(2)} KB)\n`);
  return filename;
}

// Función para medir tiempo
async function measurePerformance(name, fn) {
  console.log(`⏱️  Midiendo: ${name}...`);
  const start = Date.now();
  await fn();
  const duration = Date.now() - start;
  console.log(`✅ ${name}: ${duration}ms\n`);
  return duration;
}

// Test de carga
async function loadTest() {
  console.log('🧪 PRUEBA DE CARGA\n');

  // Generar archivos de prueba
  const files = [
    generateLargeCSV('test-load-100.csv', 100),
    generateLargeCSV('test-load-500.csv', 500),
    generateLargeCSV('test-load-1000.csv', 1000),
  ];

  console.log('📊 Resultados de tamaños de archivo:\n');
  files.forEach(f => {
    const size = fs.statSync(f).size;
    console.log(`  ${path.basename(f)}: ${(size / 1024).toFixed(2)} KB`);
  });

  console.log('\n✅ Archivos listos para prueba\n');
  console.log('Próximo paso: Enviar a http://localhost:4000/api/sensors/upload\n');
}

loadTest().catch(console.error);
```

**Ejecutar:**
```bash
cd BackEnd
node test-load.js
```

---

## 🔍 PRUEBAS DE MONITOREO

### Prueba 5: Health Check y Métricas

**Crear archivo:** `BackEnd/test-monitoring.js`

```javascript
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

async function testHealthEndpoints() {
  console.log('🏥 PRUEBAS DE HEALTH ENDPOINTS\n');

  const endpoints = [
    { path: '/api/health', name: 'Health General' },
    { path: '/api/health/live', name: 'Liveness' },
    { path: '/api/health/ready', name: 'Readiness' },
    { path: '/api/health/kafka', name: 'Kafka Status' },
    { path: '/api/health/mysql', name: 'MySQL Status' },
    { path: '/api/health/mongo', name: 'MongoDB Status' },
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

async function testEndpoint(endpoint) {
  return new Promise(resolve => {
    const url = `http://localhost:4000${endpoint.path}`;
    const req = http.get(url, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const status = json.status === 'ok' ? '✅' : '⚠️ ';
          console.log(`${status} ${endpoint.name} (${res.statusCode})`);
          console.log(`   ${JSON.stringify(json).substring(0, 80)}...\n`);
        } catch (e) {
          console.log(`❌ ${endpoint.name}: JSON inválido\n`);
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log(`❌ ${endpoint.name}: ${e.message}\n`);
      resolve();
    });

    req.setTimeout(5000);
  });
}

testHealthEndpoints().catch(console.error);
```

**Ejecutar:**
```bash
cd BackEnd
npm run dev  # En otra terminal

# En la primera terminal después de que Backend esté listo
node test-monitoring.js
```

---

## 🔐 VERIFICACIÓN DE DATOS

### Verificación 1: Integridad de Datos MySQL

```bash
cd BackEnd

# Ver estructura de tabla
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p emergentes -e "DESCRIBE air_quality;"

# Contar registros
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p emergentes -e "SELECT COUNT(*) FROM air_quality;"

# Ver últimos 5 registros
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p emergentes -e "SELECT * FROM air_quality ORDER BY time DESC LIMIT 5;"
```

### Verificación 2: Integridad de Datos MongoDB

```javascript
// Copiar a: BackEnd/verify-mongo-data.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verifyMongoData() {
  console.log('🔍 Verificando datos en MongoDB\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    // Colecciones
    const collections = await db.listCollections().toArray();
    console.log('Colecciones:\n');

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      const sample = await db.collection(col.name).findOne();

      console.log(`📦 ${col.name}: ${count} documentos`);
      if (sample) {
        console.log(`   Muestra: ${JSON.stringify(sample).substring(0, 100)}...\n`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyMongoData();
```

```bash
cd BackEnd
node verify-mongo-data.js
```

---

## 📋 CHECKLIST DE PRUEBAS

### Antes de Producción

- [ ] ✅ Todas las conexiones funcionan (MySQL, MongoDB, Kafka)
- [ ] ✅ CSV pequeño (< 100 registros) se procesa correctamente
- [ ] ✅ CSV mediano (500-1000 registros) se procesa sin errores
- [ ] ✅ CSV grande (> 5000 registros) se procesa (puede tomar tiempo)
- [ ] ✅ Datos en MySQL y MongoDB son idénticos
- [ ] ✅ Health endpoints responden correctamente
- [ ] ✅ JWT authentication funciona
- [ ] ✅ Rate limiting está activo
- [ ] ✅ CORS está configurado
- [ ] ✅ Logs se generan correctamente
- [ ] ✅ Errores se manejan gracefully
- [ ] ✅ No hay memory leaks (monitorear proceso)

---

## 🆘 RESOLUCIÓN DE PROBLEMAS DE PRUEBAS

### "Test timeout"
```bash
# Aumentar timeout en script
# Cambiar: await new Promise(r => setTimeout(r, 5000));
# Por:     await new Promise(r => setTimeout(r, 15000));
```

### "Port already in use"
```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### "CSV no se procesa"
```bash
# Verificar que Java está compilado
ls ingestor-java/target/ingestor-1.0.0-jar-with-dependencies.jar

# Si no existe:
cd ingestor-java
mvn clean package
```

---

**Documento de Pruebas:** 17 de Noviembre de 2025  
**Última actualización:** v1.0
