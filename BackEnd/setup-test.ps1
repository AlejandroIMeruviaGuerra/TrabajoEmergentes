# ============================================
# Script de Setup y Pruebas - Backend
# ============================================
# Este script configura y prueba el backend completo

Write-Host "🚀 Setup y Pruebas del Backend - Tareas Daril" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# ────────────────────────────────────────────
# Paso 1: Verificar .env
# ────────────────────────────────────────────
Write-Host "📝 Paso 1: Verificando archivo .env..." -ForegroundColor Yellow

if (!(Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env NO encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creando .env desde .env.example..." -ForegroundColor Cyan
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Archivo .env creado" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  ACCIÓN REQUERIDA:" -ForegroundColor Yellow
        Write-Host "   Edita BackEnd/.env y configura:" -ForegroundColor White
        Write-Host "   - DB_HOST, DB_USER, DB_PASS (MySQL de Railway)" -ForegroundColor White
        Write-Host "   - MONGO_URI (MongoDB de Render/Atlas)" -ForegroundColor White
        Write-Host "   - KAFKA_BROKERS=localhost:9092 (ya debería estar OK)" -ForegroundColor White
        Write-Host ""
        
        # Abrir .env en editor
        $openEditor = Read-Host "¿Abrir .env en el editor ahora? (s/n)"
        if ($openEditor -eq "s" -or $openEditor -eq "S") {
            code .env
        }
        
        Write-Host ""
        Write-Host "Presiona ENTER cuando hayas configurado .env..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host "❌ ERROR: .env.example no encontrado" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
}

Write-Host ""

# ────────────────────────────────────────────
# Paso 2: Verificar Docker
# ────────────────────────────────────────────
Write-Host "📝 Paso 2: Verificando Docker..." -ForegroundColor Yellow

$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker no está corriendo" -ForegroundColor Red
    Write-Host "   Inicia Docker Desktop y vuelve a ejecutar este script" -ForegroundColor White
    exit 1
}
Write-Host "✅ Docker está corriendo" -ForegroundColor Green

Write-Host ""

# ────────────────────────────────────────────
# Paso 3: Iniciar Kafka + Zookeeper
# ────────────────────────────────────────────
Write-Host "📝 Paso 3: Iniciando Kafka + Zookeeper..." -ForegroundColor Yellow

Set-Location ..
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml no encontrado en raíz" -ForegroundColor Red
    exit 1
}

Write-Host "   Ejecutando: docker-compose up -d" -ForegroundColor Gray
docker-compose up -d 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Kafka y Zookeeper iniciados" -ForegroundColor Green
    
    Write-Host "   Esperando 10 segundos para que Kafka esté listo..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Verificar contenedores
    Write-Host "   Verificando contenedores..." -ForegroundColor Gray
    $kafkaRunning = docker ps --filter "name=kafka" --format "{{.Names}}" | Select-String "kafka"
    $zookeeperRunning = docker ps --filter "name=zookeeper" --format "{{.Names}}" | Select-String "zookeeper"
    
    if ($kafkaRunning -and $zookeeperRunning) {
        Write-Host "   ✅ kafka: RUNNING" -ForegroundColor Green
        Write-Host "   ✅ zookeeper: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Algunos contenedores no iniciaron correctamente" -ForegroundColor Yellow
        docker ps
    }
} else {
    Write-Host "❌ Error al iniciar Kafka" -ForegroundColor Red
    exit 1
}

Set-Location BackEnd
Write-Host ""

# ────────────────────────────────────────────
# Paso 4: Verificar Topics de Kafka
# ────────────────────────────────────────────
Write-Host "📝 Paso 4: Verificando topics de Kafka..." -ForegroundColor Yellow

Write-Host "   Esperando 5 segundos más..." -ForegroundColor Gray
Start-Sleep -Seconds 5

$topics = docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Topics encontrados:" -ForegroundColor Green
    $topics | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
    
    # Verificar que existan los 6 topics esperados
    $expectedTopics = @(
        "sensores.air",
        "sensores.noise", 
        "sensores.underground",
        "sensores.air.avg1m",
        "sensores.noise.avg1m",
        "sensores.underground.avg1m"
    )
    
    $missingTopics = @()
    foreach ($topic in $expectedTopics) {
        if ($topics -notcontains $topic) {
            $missingTopics += $topic
        }
    }
    
    if ($missingTopics.Count -eq 0) {
        Write-Host "   ✅ Todos los 6 topics esperados existen" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Topics faltantes:" -ForegroundColor Yellow
        $missingTopics | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    }
} else {
    Write-Host "⚠️  No se pudieron listar topics (Kafka aún iniciando?)" -ForegroundColor Yellow
}

Write-Host ""

# ────────────────────────────────────────────
# Paso 5: Instalar dependencias npm
# ────────────────────────────────────────────
Write-Host "📝 Paso 5: Verificando dependencias npm..." -ForegroundColor Yellow

if (!(Test-Path "node_modules")) {
    Write-Host "   Instalando dependencias..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ node_modules ya existe" -ForegroundColor Green
}

Write-Host ""

# ────────────────────────────────────────────
# Paso 6: Iniciar Backend (en segundo plano)
# ────────────────────────────────────────────
Write-Host "📝 Paso 6: Iniciando Backend..." -ForegroundColor Yellow
Write-Host "   Puerto: 4000" -ForegroundColor Gray

# Iniciar en nuevo proceso de PowerShell
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -PassThru

Write-Host "✅ Backend iniciado (PID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "   Esperando 15 segundos para que inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host ""

# ────────────────────────────────────────────
# Paso 7: Probar Health Endpoints
# ────────────────────────────────────────────
Write-Host "📝 Paso 7: Probando Health Endpoints..." -ForegroundColor Yellow

$baseUrl = "http://localhost:4000"
$endpoints = @(
    "/api/health",
    "/api/health/ready",
    "/api/health/live",
    "/api/health/metrics",
    "/api/health/consumer"
)

foreach ($endpoint in $endpoints) {
    try {
        Write-Host "   Probando: $endpoint" -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing -TimeoutSec 5
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 503) {
            Write-Host "   ✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $endpoint - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# ────────────────────────────────────────────
# Paso 8: Mostrar métricas del consumer
# ────────────────────────────────────────────
Write-Host "📝 Paso 8: Métricas del Consumer..." -ForegroundColor Yellow

try {
    $metricsResponse = Invoke-RestMethod -Uri "$baseUrl/api/health/consumer" -Method GET
    
    Write-Host "📊 Métricas Actuales:" -ForegroundColor Cyan
    Write-Host "   Total Mensajes: $($metricsResponse.totalMessagesProcessed)" -ForegroundColor White
    Write-Host "   Total Errores: $($metricsResponse.totalErrors)" -ForegroundColor White
    Write-Host "   Tiempo Promedio: $($metricsResponse.averageProcessingTimeMs) ms" -ForegroundColor White
    Write-Host "   Throughput: $($metricsResponse.messagesPerSecond) msg/s" -ForegroundColor White
    Write-Host "   Uptime: $($metricsResponse.uptime)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📦 Mensajes por Topic:" -ForegroundColor Cyan
    $metricsResponse.messagesProcessed.PSObject.Properties | ForEach-Object {
        Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  No se pudieron obtener métricas: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# ────────────────────────────────────────────
# Resumen Final
# ────────────────────────────────────────────
Write-Host "=" * 60
Write-Host "✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Estado de Servicios:" -ForegroundColor Cyan
Write-Host "   ✅ Kafka: http://localhost:9092" -ForegroundColor White
Write-Host "   ✅ Backend: http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "📍 Endpoints Disponibles:" -ForegroundColor Cyan
Write-Host "   GET http://localhost:4000/api/health" -ForegroundColor White
Write-Host "   GET http://localhost:4000/api/health/consumer" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Próximos Pasos:" -ForegroundColor Yellow
Write-Host "   1. Si NO hay mensajes procesados, inicia streamer-java:" -ForegroundColor White
Write-Host "      cd ../streamer-java" -ForegroundColor Gray
Write-Host "      mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Consulta métricas en tiempo real:" -ForegroundColor White
Write-Host "      Invoke-RestMethod http://localhost:4000/api/health/consumer" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Para detener todo:" -ForegroundColor White
Write-Host "      - Ctrl+C en terminal del backend" -ForegroundColor Gray
Write-Host "      - docker-compose down (en raíz del proyecto)" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60

# Abrir navegador con endpoint de métricas
Write-Host ""
$openBrowser = Read-Host "¿Abrir métricas en navegador? (s/n)"
if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
    Start-Process "http://localhost:4000/api/health/consumer"
}
