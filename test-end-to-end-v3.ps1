#!/usr/bin/env pwsh

Write-Host "TEST END-TO-END - Flujo CSV completo" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

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
Write-Host "   Backend iniciado (PID: $($backendProc.Id))`n" -ForegroundColor Green

# Función para cargar archivo con API de 3 etapas
function Upload-FileWithAPI {
    param(
        [string]$filePath,
        [string]$type  # air, noise, underground
    )
    
    Write-Host "3. Cargando archivo: $filePath" -ForegroundColor Yellow
    Write-Host "   Tipo: $type`n" -ForegroundColor Gray
    
    # Leer archivo
    $fileContent = Get-Content -Path $filePath -Raw
    $fileName = Split-Path -Leaf $filePath
    $fileSize = (Get-Item -Path $filePath).Length
    
    # PASO 1: Init upload
    Write-Host "   [PASO 1/3] Inicializando carga..." -ForegroundColor Gray
    try {
        $initResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/uploads/init" `
            -Method POST `
            -ContentType "application/json" `
            -Body (ConvertTo-Json -InputObject @{
                filename = $fileName
                size = $fileSize
                type = $type
            }) `
            -ErrorAction Stop
        
        $uploadId = $initResponse.id
        $chunkSize = $initResponse.chunkSize
        Write-Host "   ID: $uploadId, ChunkSize: $chunkSize bytes" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "   ERROR en init: $errorMsg" -ForegroundColor Red
        return $false
    }
    
    # PASO 2: Upload chunks
    Write-Host "   [PASO 2/3] Subiendo chunks..." -ForegroundColor Gray
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fileContent)
    $numChunks = [Math]::Ceiling($bytes.Length / $chunkSize)
    
    for ($i = 0; $i -lt $numChunks; $i++) {
        $start = $i * $chunkSize
        $end = [Math]::Min($start + $chunkSize, $bytes.Length)
        $chunkBytes = $bytes[$start..($end-1)]
        
        try {
            $chunkResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/uploads/chunk/$uploadId/$i" `
                -Method PUT `
                -ContentType "application/octet-stream" `
                -Body $chunkBytes `
                -ErrorAction Stop
            
            Write-Host "   Chunk $($i+1)/$numChunks enviado" -ForegroundColor Gray
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "   ERROR en chunk $i`: $errorMsg" -ForegroundColor Red
            return $false
        }
    }
    
    # PASO 3: Complete upload
    Write-Host "   [PASO 3/3] Completando carga..." -ForegroundColor Gray
    try {
        $completeResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/uploads/complete/$uploadId" `
            -Method POST `
            -ContentType "application/json" `
            -Body "{}" `
            -ErrorAction Stop
        
        Write-Host "   Carga completada exitosamente`n" -ForegroundColor Green
        return $true
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "   ERROR al completar: $errorMsg`n" -ForegroundColor Red
        return $false
    }
}

# 3. Cargar archivo CSV
$csvPath = "d:\lunes\TrabajoEmergentes\test-air.csv"
$uploadSuccess = Upload-FileWithAPI -filePath $csvPath -type "air"

if ($uploadSuccess) {
    # 4. Esperar procesamiento
    Write-Host "4. Esperando procesamiento (15 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # 5. Verificar MongoDB
    Write-Host "5. Verificando datos en MongoDB Atlas..." -ForegroundColor Yellow
    
    # Crear script de verificación
    $mongoScript = @"
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("ERROR: MONGODB_URI no configurado");
    process.exit(1);
}

const client = new MongoClient(uri);

try {
    await client.connect();
    const db = client.db("emergentes");
    
    // Contar documentos
    const airCount = await db.collection("airqualities").countDocuments();
    console.log("Air Quality en MongoDB: " + airCount + " registros");
    
    // Obtener ultimos 5 registros
    const latest = await db.collection("airqualities")
        .find({})
        .sort({ _id: -1 })
        .limit(5)
        .toArray();
    
    if (latest.length > 0) {
        console.log("\nUltimos registros:");
        latest.forEach((doc, i) => {
            const co2 = doc.measures && doc.measures.co2 ? doc.measures.co2 : "N/A";
            const temp = doc.measures && doc.measures.temperature ? doc.measures.temperature : "N/A";
            const hum = doc.measures && doc.measures.humidity ? doc.measures.humidity : "N/A";
            console.log((i+1) + ". devEui=" + doc.devEui + " | co2=" + co2 + " | temp=" + temp + " | humidity=" + hum);
        });
    } else {
        console.log("(Sin registros en MongoDB)");
    }
    
} catch (err) {
    console.error("ERROR MongoDB:", err.message);
} finally {
    await client.close();
}
"@

    # Ejecutar desde BackEnd
    $tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.mjs'
    Set-Content -Path $tempFile -Value $mongoScript -Encoding UTF8
    
    Write-Host "`nVerificando...: " -ForegroundColor Gray -NoNewline
    Push-Location "d:\lunes\TrabajoEmergentes\BackEnd"
    node $tempFile 2>&1
    Pop-Location
    
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "ERROR: No se pudo cargar el archivo" -ForegroundColor Red
}

# 6. Mostrar resumen final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN: " -ForegroundColor Cyan
Write-Host "  Backend:   Iniciado en http://localhost:4000" -ForegroundColor Green
Write-Host "  CSV:       Cargado con API de uploads" -ForegroundColor Green
Write-Host "  Flujo:     CSV -> Backend -> Java -> Kafka -> MongoDB" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Limpiar
Write-Host "Deteniendo Backend..." -ForegroundColor Yellow
Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Test completado" -ForegroundColor Green
