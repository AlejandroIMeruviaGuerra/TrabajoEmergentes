# ============================================
# Script de Prueba Rápida - Todos los Servicios
# ============================================

param(
    [switch]$SkipKafka,
    [switch]$SkipBackend,
    [switch]$SkipStreamer
)

$ErrorActionPreference = "Continue"

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧪 PRUEBA COMPLETA - BACKEND + KAFKA + CONSUMER        ║
║                                                           ║
║   Tareas Daril - 5/7 completadas (71%)                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Start-Sleep -Seconds 2

# ────────────────────────────────────────────
# Verificar Pre-requisitos
# ────────────────────────────────────────────
Write-Host "🔍 Verificando pre-requisitos..." -ForegroundColor Yellow
Write-Host ""

# Docker
Write-Host "   Verificando Docker..." -NoNewline
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Docker no está corriendo" -ForegroundColor Red
        Write-Host "      Inicia Docker Desktop y vuelve a ejecutar" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host " ❌ Docker no encontrado" -ForegroundColor Red
    exit 1
}

# Node.js
Write-Host "   Verificando Node.js..." -NoNewline
try {
    $nodeVersion = node -v
    Write-Host " ✅ ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host " ❌ Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Java
Write-Host "   Verificando Java..." -NoNewline
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ⚠️  Java no encontrado (opcional para streamer)" -ForegroundColor Yellow
}

# Maven
Write-Host "   Verificando Maven..." -NoNewline
try {
    mvn -v > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Maven no encontrado (opcional para streamer)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠️  Maven no encontrado (opcional para streamer)" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 1

# ────────────────────────────────────────────
# Paso 1: Kafka + Zookeeper
# ────────────────────────────────────────────
if (-not $SkipKafka) {
    Write-Host "📦 Paso 1: Kafka + Zookeeper" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    # La raíz del proyecto es donde se encuentra este script
    $projectRoot = $PSScriptRoot
    
    # Verificar si ya está corriendo
    $kafkaRunning = docker ps --filter "name=kafka" --format "{{.Names}}" | Select-String "kafka"
    
    if ($kafkaRunning) {
        Write-Host "   ℹ️  Kafka ya está corriendo" -ForegroundColor Cyan
    } else {
        Write-Host "   🚀 Iniciando Kafka + Zookeeper..." -ForegroundColor Yellow
        Set-Location $projectRoot # Asegurarse de estar en la raíz para docker-compose
        docker compose up -d 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Kafka iniciado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Error al iniciar Kafka" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "   ⏳ Esperando 15 segundos para que Kafka esté listo..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Verificar topics
    Write-Host "   🔍 Verificando topics..." -ForegroundColor Yellow
    $topics = docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        $topicCount = ($topics | Measure-Object).Count
        Write-Host "   ✅ $topicCount topics encontrados" -ForegroundColor Green
        
        $expectedTopics = @(
            "sensores.air",
            "sensores.noise",
            "sensores.underground",
            "sensores.air.avg1m",
            "sensores.noise.avg1m",
            "sensores.underground.avg1m"
        )
        
        $found = 0
        foreach ($topic in $expectedTopics) {
            if ($topics -contains $topic) {
                $found++
            }
        }
        
        Write-Host "   📊 Topics esperados: $found/6" -ForegroundColor $(if ($found -eq 6) { "Green" } else { "Yellow" })
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1
}

# ────────────────────────────────────────────
# Paso 2: Backend
# ────────────────────────────────────────────
if (-not $SkipBackend) {
    Write-Host "🟢 Paso 2: Backend (Consumer)" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    Set-Location "$projectRoot\BackEnd"
    
    # Verificar .env
    if (!(Test-Path ".env")) {
        Write-Host "   ⚠️  Archivo .env no encontrado" -ForegroundColor Yellow
        
        if (Test-Path ".env.example") {
            Write-Host "   📝 Creando .env desde .env.example..." -ForegroundColor Cyan
            Copy-Item ".env.example" ".env"
            
            Write-Host ""
            Write-Host "   ⚠️  ACCIÓN REQUERIDA:" -ForegroundColor Red
            Write-Host "      Edita BackEnd\.env con tus credenciales:" -ForegroundColor Yellow
            Write-Host "      - DB_HOST, DB_USER, DB_PASS (MySQL Railway)" -ForegroundColor White
            Write-Host "      - MONGO_URI (MongoDB Render/Atlas)" -ForegroundColor White
            Write-Host ""
            
            $continue = Read-Host "   ¿Has configurado .env? (s/n)"
            if ($continue -ne "s" -and $continue -ne "S") {
                Write-Host "   ⏸️  Abortando. Configura .env y vuelve a ejecutar." -ForegroundColor Yellow
                exit 0
            }
        } else {
            Write-Host "   ❌ .env.example no encontrado" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ✅ Archivo .env encontrado" -ForegroundColor Green
    }
    
    # Instalar dependencias si no existen
    if (!(Test-Path "node_modules")) {
        Write-Host "   📦 Instalando dependencias npm..." -ForegroundColor Yellow
        npm install 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Error al instalar dependencias" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ✅ Dependencias ya instaladas" -ForegroundColor Green
    }
    
    # Iniciar backend en nuevo proceso
    Write-Host "   🚀 Iniciando Backend en puerto 4000..." -ForegroundColor Yellow
    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -PassThru -WindowStyle Normal
    
    Write-Host "   ✅ Backend iniciado (PID: $($backendProcess.Id))" -ForegroundColor Green
    Write-Host "   ⏳ Esperando 20 segundos para que inicie..." -ForegroundColor Gray
    Start-Sleep -Seconds 20
    
    Write-Host ""
}

# ────────────────────────────────────────────
# Paso 3: Frontend
# ────────────────────────────────────────────
Write-Host "🎨 Paso 3: Frontend (Vite)" -ForegroundColor Cyan
Write-Host "─" * 60

Set-Location "$projectRoot\FrontEnd\Emergentes"

# Instalar dependencias si no existen
if (!(Test-Path "node_modules")) {
    Write-Host "   📦 Instalando dependencias npm del frontend..." -ForegroundColor Yellow
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al instalar dependencias del frontend" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ Dependencias del frontend ya instaladas" -ForegroundColor Green
}

# Instalar jwt-decode si no existe
if (-not (Get-Content package.json | Select-String '"jwt-decode"')) {
    Write-Host "   📦 Instalando jwt-decode..." -ForegroundColor Yellow
    npm install jwt-decode 2>&1 | Out-Null
}

# Iniciar frontend en nuevo proceso
Write-Host "   🚀 Iniciando Frontend en puerto 5173..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -PassThru -WindowStyle Normal

Write-Host "   ✅ Frontend iniciado (PID: $($frontendProcess.Id))" -ForegroundColor Green
Write-Host ""

# ────────────────────────────────────────────
# Paso 4: Probar Endpoints
# ────────────────────────────────────────────
Write-Host "🧪 Paso 4: Probar Health Endpoints" -ForegroundColor Cyan
Write-Host "─" * 60

$baseUrl = "http://localhost:4000"
$endpoints = @{
    "/api/health" = "Health Check Completo"
    "/api/health/ready" = "Readiness Check"
    "/api/health/live" = "Liveness Check"
    "/api/health/metrics" = "System Metrics"
    "/api/health/consumer" = "Consumer Metrics"
}

$allSuccess = $true

foreach ($endpoint in $endpoints.Keys) {
    $description = $endpoints[$endpoint]
    Write-Host "   Probando: $description" -ForegroundColor Gray
    Write-Host "   URL: $baseUrl$endpoint" -ForegroundColor DarkGray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 503) {
            Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $allSuccess = $false
    }
    Write-Host ""
}

# ────────────────────────────────────────────
# Paso 5: Mostrar Métricas Iniciales
# ────────────────────────────────────────────
Write-Host "📊 Paso 5: Métricas del Consumer (Inicial)" -ForegroundColor Cyan
Write-Host "─" * 60

try {
    $metrics = Invoke-RestMethod -Uri "$baseUrl/api/health/consumer" -Method GET -TimeoutSec 10
    
    Write-Host "   Timestamp: $(Get-Date -UnixTimeSeconds ($metrics.timestamp / 1000) -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host "   Uptime: $($metrics.uptime)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   📈 Totales:" -ForegroundColor Yellow
    Write-Host "      Mensajes Procesados: $($metrics.totalMessagesProcessed)" -ForegroundColor $(if ($metrics.totalMessagesProcessed -gt 0) { "Green" } else { "Yellow" })
    Write-Host "      Errores: $($metrics.totalErrors)" -ForegroundColor $(if ($metrics.totalErrors -gt 0) { "Red" } else { "Green" })
    Write-Host "      Avg Processing: $($metrics.averageProcessingTimeMs) ms" -ForegroundColor White
    Write-Host "      Throughput: $($metrics.messagesPerSecond) msg/s" -ForegroundColor White
    Write-Host ""
    
    if ($metrics.totalMessagesProcessed -eq 0) {
        Write-Host "   ℹ️  No hay mensajes procesados aún (normal sin producer)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "   ❌ No se pudieron obtener métricas" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ────────────────────────────────────────────
# Paso 6: Preguntar por Streamer
# ────────────────────────────────────────────
if (-not $SkipStreamer) {
    Write-Host "🚀 Paso 6: Streamer Java (Producer)" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    Write-Host "   El streamer-java genera mensajes de sensores para Kafka" -ForegroundColor White
    Write-Host ""
    
    $startStreamer = Read-Host "   ¿Iniciar streamer-java ahora? (s/n)"
    
    if ($startStreamer -eq "s" -or $startStreamer -eq "S") {
        Set-Location "$projectRoot\streamer-java"
        
        # Verificar que existe el proyecto
        if (!(Test-Path "pom.xml")) {
            Write-Host "   ❌ Proyecto streamer-java no encontrado" -ForegroundColor Red
        } else {
            Write-Host "   📦 Compilando streamer-java..." -ForegroundColor Yellow
            mvn -q -DskipTests package 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Compilación exitosa" -ForegroundColor Green
                
                Write-Host "   🚀 Iniciando streamer en nueva ventana..." -ForegroundColor Yellow
                $streamerCmd = "cd '$PWD'; java -jar target/streamer-1.0.0-jar-with-dependencies.jar -Dbootstrap.servers=localhost:9092 -Dapplication.id=gamc-streams"
                Start-Process powershell -ArgumentList "-NoExit", "-Command", $streamerCmd -WindowStyle Normal
                
                Write-Host "   ✅ Streamer iniciado" -ForegroundColor Green
                Write-Host "   ⏳ Esperando 10 segundos para que empiece a enviar mensajes..." -ForegroundColor Gray
                Start-Sleep -Seconds 10
            } else {
                Write-Host "   ❌ Error al compilar" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ⏭️  Omitiendo streamer (puedes iniciarlo manualmente después)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Para iniciarlo manualmente:" -ForegroundColor Cyan
        Write-Host "      cd streamer-java" -ForegroundColor Gray
        Write-Host "      mvn -q -DskipTests package" -ForegroundColor Gray
        Write-Host "      java -jar target/streamer-1.0.0-jar-with-dependencies.jar -Dbootstrap.servers=localhost:9092 -Dapplication.id=gamc-streams" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# ────────────────────────────────────────────
# Monitoreo de Métricas
# ────────────────────────────────────────────
Write-Host "📊 Monitoreo de Métricas en Tiempo Real" -ForegroundColor Cyan
Write-Host "─" * 60
Write-Host ""

$monitor = Read-Host "¿Mostrar métricas en loop cada 5 segundos? (s/n)"

if ($monitor -eq "s" -or $monitor -eq "S") {
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el monitoreo" -ForegroundColor Yellow
    Write-Host ""
    Start-Sleep -Seconds 2
    
    while ($true) {
        Clear-Host
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "║     📊 MÉTRICAS DEL CONSUMER - $(Get-Date -Format 'HH:mm:ss')              ║" -ForegroundColor Cyan
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
        Write-Host ""
        
        try {
            $metrics = Invoke-RestMethod -Uri "$baseUrl/api/health/consumer" -Method GET -TimeoutSec 5
            
            Write-Host "⏰ Uptime: " -NoNewline -ForegroundColor White
            Write-Host $metrics.uptime -ForegroundColor Cyan
            Write-Host ""
            
            Write-Host "📈 TOTALES:" -ForegroundColor Yellow
            Write-Host "   Mensajes Procesados: " -NoNewline -ForegroundColor White
            Write-Host $metrics.totalMessagesProcessed -ForegroundColor Green
            
            Write-Host "   Errores: " -NoNewline -ForegroundColor White
            Write-Host $metrics.totalErrors -ForegroundColor $(if ($metrics.totalErrors -gt 0) { "Red" } else { "Green" })
            
            Write-Host "   Avg Processing Time: " -NoNewline -ForegroundColor White
            Write-Host "$([math]::Round($metrics.averageProcessingTimeMs, 2)) ms" -ForegroundColor Cyan
            
            Write-Host "   Throughput: " -NoNewline -ForegroundColor White
            Write-Host "$([math]::Round($metrics.messagesPerSecond, 2)) msg/s" -ForegroundColor Magenta
            
            Write-Host ""
            Write-Host "📦 MENSAJES POR TOPIC:" -ForegroundColor Yellow
            
            $metrics.messagesProcessed.PSObject.Properties | ForEach-Object {
                $topicName = $_.Name -replace "sensores.", ""
                Write-Host "   $topicName" -NoNewline -ForegroundColor White
                Write-Host (" " * (30 - $topicName.Length)) -NoNewline
                Write-Host $_.Value -ForegroundColor Cyan
            }
            
            if ($metrics.totalErrors -gt 0) {
                Write-Host ""
                Write-Host "❌ ERRORES POR TOPIC:" -ForegroundColor Red
                $metrics.errors.PSObject.Properties | Where-Object { $_.Value -gt 0 } | ForEach-Object {
                    Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor Red
                }
            }
            
        } catch {
            Write-Host "❌ Error al obtener métricas: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "─" * 60 -ForegroundColor DarkGray
        Write-Host "Actualizando en 5 segundos... (Ctrl+C para detener)" -ForegroundColor Gray
        
        Start-Sleep -Seconds 5
    }
}

# ────────────────────────────────────────────
# Resumen Final
# ────────────────────────────────────────────
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "║                  ✅ PRUEBA COMPLETADA                     ║" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Servicios Activos:" -ForegroundColor Cyan
Write-Host "   ✅ Kafka: http://localhost:9092" -ForegroundColor White
Write-Host "   ✅ Backend: http://localhost:4000" -ForegroundColor White
Write-Host ""

Write-Host "📍 Endpoints Disponibles:" -ForegroundColor Cyan
Write-Host "   GET http://localhost:4000/api/health" -ForegroundColor Gray
Write-Host "   GET http://localhost:4000/api/health/consumer" -ForegroundColor Gray
Write-Host "   GET http://localhost:4000/api/health/ready" -ForegroundColor Gray
Write-Host ""

Write-Host "🛑 Para detener todo:" -ForegroundColor Yellow
Write-Host "   1. Ctrl+C en terminales de backend y streamer" -ForegroundColor Gray
Write-Host "   2. docker compose down (en raíz del proyecto)" -ForegroundColor Gray
Write-Host ""
