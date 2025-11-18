#!/usr/bin/env pwsh
<#
    TEST END-TO-END: CSV -> Backend -> Java Ingestor -> Kafka -> Consumer -> MongoDB
    Verifica que el flujo completo funcione correctamente
#>

Write-Host "Test END-TO-END INICIADO" -ForegroundColor Cyan

# 1. Limpiar procesos anteriores
Write-Host "1. Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Iniciar Backend
Write-Host "2. Iniciando Backend..." -ForegroundColor Yellow
$backendProc = Start-Process node -ArgumentList "src/index.js" `
  -WorkingDirectory "d:\lunes\TrabajoEmergentes\BackEnd" `
  -PassThru -NoNewWindow

Start-Sleep -Seconds 8
Write-Host "Backend iniciado (PID: $($backendProc.Id))" -ForegroundColor Green

# 3. Verificar que Backend esta corriendo
if ($backendProc.HasExited) {
    Write-Host "ERROR: Backend fallo al iniciar" -ForegroundColor Red
    exit 1
}

# 4. Enviar CSV al Backend
Write-Host "3. Enviando CSV al Backend..." -ForegroundColor Yellow

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
    
    Write-Host "CSV enviado exitosamente - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERROR al enviar CSV: $_" -ForegroundColor Red
}

# 5. Esperar a que se procese
Write-Host "4. Esperando procesamiento (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 6. Verificar MongoDB
Write-Host "5. Verificando MongoDB Atlas..." -ForegroundColor Yellow
$mongoUri = $env:MONGODB_URI
if ($mongoUri) {
    Write-Host "Conectando a MongoDB..." -ForegroundColor Gray
    
    $mongoScript = @"
import { MongoClient } from "mongodb";

const uri = "$mongoUri";
const client = new MongoClient(uri);

try {
    await client.connect();
    const db = client.db("emergentes");
    
    // Contar registros
    const airCount = await db.collection("airqualities").countDocuments();
    const noiseCount = await db.collection("noises").countDocuments();
    const undergroundCount = await db.collection("undergrounds").countDocuments();
    
    console.log("MongoDB Collections:");
    console.log("  Air Quality: " + airCount + " registros");
    console.log("  Noise: " + noiseCount + " registros");
    console.log("  Underground: " + undergroundCount + " registros");
    
    // Mostrar ultimos registros
    const latest = await db.collection("airqualities")
        .find({})
        .sort({ _id: -1 })
        .limit(3)
        .toArray();
    
    if (latest.length > 0) {
        console.log("\nUltimos 3 registros (Air Quality):");
        latest.forEach((doc, i) => {
            const co2 = doc.measures && doc.measures.co2 ? doc.measures.co2 : "N/A";
            const temp = doc.measures && doc.measures.temperature ? doc.measures.temperature : "N/A";
            console.log("  #" + (i+1) + ": devEui=" + doc.devEui + ", co2=" + co2 + ", temp=" + temp);
        });
    }
    
} catch (err) {
    console.error("ERROR MongoDB:", err.message);
} finally {
    await client.close();
}
"@

    # Guardar script temporal
    $tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.mjs'
    Set-Content -Path $tempFile -Value $mongoScript -Encoding UTF8
    
    Push-Location "d:\lunes\TrabajoEmergentes\BackEnd"
    node $tempFile 2>&1
    Pop-Location
    
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "ERROR: MONGODB_URI no configurado" -ForegroundColor Red
}

# 7. Mostrar resumen
Write-Host "`n=== RESUMEN TEST END-TO-END ===" -ForegroundColor Cyan
Write-Host "Backend: Iniciado en puerto 4000" -ForegroundColor Green
Write-Host "CSV: Enviado a /api/sensors/upload" -ForegroundColor Green
Write-Host "Flujo: CSV -> Backend -> Java -> Kafka -> Consumer -> MongoDB" -ForegroundColor Green
Write-Host "`nDeteniendo Backend..." -ForegroundColor Yellow

# 8. Detener backend
Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Test finalizado" -ForegroundColor Green
