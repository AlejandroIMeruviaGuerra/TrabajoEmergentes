# init-topics.ps1 - Script PowerShell para crear topics de Kafka de manera idempotente
# Uso: .\infra\kafka\init-topics.ps1

Write-Host "🚀 Iniciando creación de topics en Kafka..." -ForegroundColor Cyan
Write-Host ""

# Array de topics a crear
$topics = @(
    "sensores.air",
    "sensores.noise",
    "sensores.underground",
    "sensores.air.avg1m",
    "sensores.noise.avg1m",
    "sensores.underground.avg1m"
)

$errorCount = 0

# Iterar sobre cada topic
foreach ($topic in $topics) {
    Write-Host "📌 Creando/verificando topic: $topic" -ForegroundColor Yellow
    
    docker exec kafka kafka-topics.sh `
        --create `
        --if-not-exists `
        --bootstrap-server localhost:9092 `
        --replication-factor 1 `
        --partitions 1 `
        --topic $topic
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Topic '$topic' listo" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al crear topic '$topic'" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "✅ Todos los topics fueron creados/verificados exitosamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Se encontraron $errorCount errores durante la creación" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Listado de topics existentes:" -ForegroundColor Cyan
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

Write-Host ""
Write-Host "✨ Proceso completado" -ForegroundColor Cyan
