# Script para probar Rate Limiting
# Hace 105 peticiones rápidas al endpoint de sensores

Write-Host "Iniciando prueba de Rate Limiting..." -ForegroundColor Cyan
Write-Host "Haciendo 105 peticiones al endpoint /api/sensors/air" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$blockedCount = 0
$url = 'http://localhost:4000/api/sensors/air?page=1&limit=5'

for ($i = 1; $i -le 105; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -ErrorAction Stop
        $successCount++
        
        # Mostrar progreso cada 10 requests
        if ($i % 10 -eq 0) {
            $remaining = $response.Headers['RateLimit-Remaining']
            Write-Host "OK Request $i - Status: $($response.StatusCode) - Remaining: $remaining" -ForegroundColor Green
        }
    }
    catch {
        $blockedCount++
        if ($blockedCount -eq 1) {
            Write-Host ""
            Write-Host "RATE LIMIT ALCANZADO en request #$i" -ForegroundColor Red
            Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
        
        # Mostrar solo los primeros 3 bloqueos
        if ($blockedCount -le 3) {
            Write-Host "BLOQUEADO Request $i - (429 Too Many Requests)" -ForegroundColor Red
        }
    }
    
    # Pequeña pausa para no saturar (5ms)
    Start-Sleep -Milliseconds 5
}

Write-Host ""
Write-Host "RESULTADOS:" -ForegroundColor Cyan
Write-Host "   Exitosas: $successCount" -ForegroundColor Green
Write-Host "   Bloqueadas: $blockedCount" -ForegroundColor Red
Write-Host ""

if ($blockedCount -gt 0) {
    Write-Host "Rate Limiting FUNCIONA CORRECTAMENTE!" -ForegroundColor Green
} else {
    Write-Host "Rate Limiting NO BLOQUEO ninguna peticion" -ForegroundColor Yellow
}
