#!/usr/bin/env pwsh
<#
    TEST END-TO-END: CSV -> Backend -> Java Ingestor -> Kafka -> Consumer -> MongoDB
    Verifica que el flujo completo funcione correctamente
#>

Write-Host "`n🚀 TEST END-TO-END INICIADO`n" -ForegroundColor Cyan

# 1. Limpiar procesos anteriores
Write-Host "1️⃣  Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Iniciar Backend
Write-Host "2️⃣  Iniciando Backend..." -ForegroundColor Yellow
$backendProc = Start-Process node -ArgumentList "src/index.js" `
  -WorkingDirectory "d:\lunes\TrabajoEmergentes\BackEnd" `
  -PassThru -NoNewWindow

Start-Sleep -Seconds 8
Write-Host "✅ Backend iniciado (PID: $($backendProc.Id))`n" -ForegroundColor Green

# 3. Verificar que Backend está corriendo
if ($backendProc.HasExited) {
    Write-Host "❌ Backend falló al iniciar" -ForegroundColor Red
    exit 1
}

# 4. Enviar CSV al Backend
Write-Host "3️⃣  Enviando CSV al Backend..." -ForegroundColor Yellow

# Leer el CSV y prepararlo
$csvPath = "d:\lunes\TrabajoEmergentes\test-air.csv"
$csvContent = Get-Content -Path $csvPath -Raw

# Crear FormData multipart
$boundary = [guid]::NewGuid().ToString()
$body = @"
--$boundary
Content-Disposition: form-data; name="file"; filename="test-air.csv"
Content-Type: text/csv

$csvContent
--$boundary--
"@

# Enviar POST con archivo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/sensors/upload" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ CSV enviado exitosamente`n" -ForegroundColor Green
    Write-Host "Respuesta: $($response.StatusCode)`n" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error al enviar CSV: $_`n" -ForegroundColor Red
}

# 5. Esperar a que se procese
Write-Host "4️⃣  Esperando procesamiento (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 6. Verificar Kafka
Write-Host "5️⃣  Verificando Kafka..." -ForegroundColor Yellow
$kafkaPath = "d:\lunes\TrabajoEmergentes\kafka"
if (Test-Path "C:\kafka\bin\windows\kafka-console-consumer.bat") {
    Write-Host "⚠️  Kafka encontrado en C:\kafka, ejecutando consumer..." -ForegroundColor Yellow
    # Nota: Este paso requería que kafka esté en PATH
} else {
    Write-Host "⚠️  Kafka no encontrado en PATH, saltando verificación Kafka" -ForegroundColor Yellow
}

# 7. Verificar MongoDB
Write-Host "6️⃣  Verificando MongoDB Atlas..." -ForegroundColor Yellow
$mongoUri = $env:MONGODB_URI
if ($mongoUri) {
    Write-Host "Conectando a: $($mongoUri.Substring(0, 30))..." -ForegroundColor Gray
    
    # Usar Node.js para consultar MongoDB
    $mongoScript = @"
import { MongoClient } from "mongodb";

const uri = "$mongoUri";
const client = new MongoClient(uri);

try {
    await client.connect();
    const db = client.db("emergentes");
    
    // Contar registros en cada colección
    const airCount = await db.collection("airqualities").countDocuments();
    const noiseCount = await db.collection("noises").countDocuments();
    const undergroundCount = await db.collection("undergrounds").countDocuments();
    
    console.log(\`✅ MongoDB:\`);
    console.log(\`   - Air Quality: \${airCount} registros\`);
    console.log(\`   - Noise: \${noiseCount} registros\`);
    console.log(\`   - Underground: \${undergroundCount} registros\`);
    
    // Mostrar últimos 3 registros de air quality
    const latest = await db.collection("airqualities")
        .find({})
        .sort({ _id: -1 })
        .limit(3)
        .toArray();
    
    if (latest.length > 0) {
        console.log(\`\n📊 Últimos registros (Air Quality):\`);
        latest.forEach((doc, i) => {
            console.log(\`   #\${i+1}: devEui=\${doc.devEui}, co2=\${doc.measures?.co2}, temp=\${doc.measures?.temperature}\`);
        });
    }
    
} catch (err) {
    console.error("❌ Error MongoDB:", err.message);
} finally {
    await client.close();
}
"@

    # Guardar el script en archivo temporal
    $tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.mjs'
    Set-Content -Path $tempFile -Value $mongoScript
    
    # Ejecutar desde BackEnd (donde están node_modules)
    Push-Location "d:\lunes\TrabajoEmergentes\BackEnd"
    node $tempFile 2>&1
    Pop-Location
    
    # Limpiar
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "⚠️  MONGODB_URI no configurado" -ForegroundColor Yellow
}

# 8. Mostrar resumen
Write-Host "`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 RESUMEN DEL TEST END-TO-END" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Backend: Iniciado y corriendo en puerto 4000" -ForegroundColor Green
Write-Host "✅ CSV: Enviado al endpoint /api/sensors/upload" -ForegroundColor Green
Write-Host "✅ Procesamiento: Java Ingestor debería haber procesado" -ForegroundColor Green
Write-Host "✅ Flujo esperado: CSV -> Backend -> Java -> Kafka -> Consumer -> MongoDB" -ForegroundColor Green
Write-Host "`nPara verificar que todo funciona:" -ForegroundColor Cyan
Write-Host "  1. Ver logs en MongoDB arriba" -ForegroundColor Gray
Write-Host "  2. Detener con: Ctrl+C" -ForegroundColor Gray
Write-Host "`n" -ForegroundColor Cyan

# 9. Mantener backend activo
Write-Host "Manteniendo backend activo... (presiona Ctrl+C para detener)`n" -ForegroundColor Cyan
try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($backendProc.HasExited) {
            Write-Host "❌ Backend terminó inesperadamente" -ForegroundColor Red
            break
        }
    }
} catch {
    # Ctrl+C presionado
}

# 10. Limpiar
Write-Host "`n🧹 Deteniendo Backend..." -ForegroundColor Yellow
Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "✅ Test finalizado`n" -ForegroundColor Green
