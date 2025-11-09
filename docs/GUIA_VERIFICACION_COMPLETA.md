# 🧪 Guía de Verificación Completa - Todas las Tareas

**Fecha:** 2025-01-XX  
**Proyecto:** TrabajoEmergentes - Daril  
**Estado:** 7/7 tareas completadas (100%)

---

## 🚀 Paso 1: Iniciar Servicios

### 1.1. Kafka + Zookeeper

**Terminal 1 (PowerShell):**
```powershell
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\infra\kafka
docker-compose up
```

**✅ Verificar:**
```
[+] Running 2/2
 ✔ Container zookeeper  Started
 ✔ Container kafka      Started
```

**Esperar 15-20 segundos** para que Kafka termine de iniciar.

---

### 1.2. Backend

**Terminal 2 (PowerShell - NUEVA VENTANA):**
```powershell
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\BackEnd
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

**✅ Verificar logs:**
```
✅ Conectado a MySQL
✅ Conectado a MongoDB Atlas
✅ Kafka consumer conectado
✅ Kafka consumer suscrito a crudos y agregados (avg1m)
✅ Servidor corriendo en http://localhost:4000
```

⚠️ **Nota:** Los warnings de índices SQL son normales (índices ya existen).

---

## 🧪 Paso 2: Verificar Endpoints Básicos

**Terminal 3 (PowerShell - NUEVA VENTANA):**

### 2.1. Health Check General
```powershell
Invoke-RestMethod http://localhost:4000/api/health | ConvertTo-Json -Depth 5
```

**✅ Esperado:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "uptime": "00:05:30",
  "services": {
    "mysql": { "status": "connected", "responseTime": "10ms" },
    "mongodb": { "status": "connected", "responseTime": "15ms" },
    "kafka": { "status": "connected" }
  }
}
```

---

### 2.2. Readiness Check
```powershell
Invoke-RestMethod http://localhost:4000/api/health/ready | ConvertTo-Json -Depth 3
```

**✅ Esperado:**
```json
{
  "ready": true,
  "timestamp": 1234567890,
  "checks": {
    "mysql": true,
    "mongodb": true
  }
}
```

---

### 2.3. Liveness Check
```powershell
Invoke-RestMethod http://localhost:4000/api/health/live
```

**✅ Esperado:**
```json
{
  "alive": true,
  "timestamp": 1234567890
}
```

---

## 📊 Paso 3: Verificar Métricas Básicas del Consumer

### 3.1. Métricas Básicas
```powershell
Invoke-RestMethod http://localhost:4000/api/health/consumer | ConvertTo-Json -Depth 5
```

**✅ Esperado:**
```json
{
  "uptime": 300,
  "uptimeFormatted": "5m 0s",
  "totalMessages": 0,
  "totalErrors": 0,
  "errorRate": "0%",
  "messagesPerSecond": "0",
  "averageProcessingTime": "0 ms",
  "byTopic": {
    "sensores.air": {
      "processed": 0,
      "errors": 0,
      "lastMessage": null,
      "errorRate": "0%"
    }
  }
}
```

---

## 🎯 Paso 4: Verificar Métricas AVANZADAS (NUEVA - Tarea 7)

### 4.1. Métricas Avanzadas Completas
```powershell
$metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer/advanced
$metrics | ConvertTo-Json -Depth 6
```

**✅ Esperado:**
```json
{
  "uptime": 300,
  "uptimeFormatted": "5m 0s",
  "totalMessages": 0,
  "totalErrors": 0,
  "advanced": {
    "latency": {
      "p50": 0,
      "p95": 0,
      "p99": 0,
      "min": 0,
      "max": 0
    },
    "throughput": {},
    "messageSize": {
      "count": 0,
      "totalBytes": 0,
      "avgBytes": 0,
      "minBytes": 0,
      "maxBytes": 0,
      "totalMB": "0.00"
    },
    "batch": {
      "totalBatches": 0,
      "avgBatchSize": 0
    },
    "consumerLag": {
      "totalLag": 0,
      "byTopic": {},
      "status": "up-to-date"
    }
  }
}
```

### 4.2. Verificar Solo Latencia
```powershell
$metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer/advanced
$metrics.advanced.latency | ConvertTo-Json
```

### 4.3. Verificar Solo Throughput
```powershell
$metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer/advanced
$metrics.advanced.throughput | ConvertTo-Json
```

### 4.4. Verificar Solo Message Size
```powershell
$metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer/advanced
$metrics.advanced.messageSize | ConvertTo-Json
```

---

## 📄 Paso 5: Verificar Paginación (Tarea B2)

### 5.1. Primera Página (Default)
```powershell
Invoke-RestMethod "http://localhost:4000/api/sensors/air" | ConvertTo-Json -Depth 3
```

**✅ Esperado:**
```json
{
  "ok": true,
  "data": [],
  "meta": {
    "total": 0,
    "pages": 0,
    "currentPage": 1,
    "limit": 50,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 5.2. Con Parámetros Personalizados
```powershell
Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=1&limit=10" | ConvertTo-Json -Depth 3
```

**✅ Esperado:** Metadata con `limit: 10`

---

## 🚦 Paso 6: Verificar Rate Limiting (Tarea B2)

### 6.1. Dentro del Límite
```powershell
# Hacer 10 peticiones (bien dentro del límite de 100)
1..10 | ForEach-Object { 
  $response = Invoke-RestMethod http://localhost:4000/api/sensors/air
  Write-Host "Request $_`: OK, total=$($response.meta.total)" -ForegroundColor Green
}
```

**✅ Esperado:** Todas las peticiones exitosas

### 6.2. Verificar Headers de Rate Limit
```powershell
$response = Invoke-WebRequest http://localhost:4000/api/sensors/air

Write-Host "RateLimit-Limit: $($response.Headers['RateLimit-Limit'])"
Write-Host "RateLimit-Remaining: $($response.Headers['RateLimit-Remaining'])"
Write-Host "RateLimit-Reset: $($response.Headers['RateLimit-Reset'])"
```

**✅ Esperado:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1705756800
```

---

## 🎨 Paso 7: Enviar Mensajes de Prueba (Simular Producer)

### 7.1. Enviar Mensaje de Aire
```powershell
$airData = @{
  devEui = "eui-70B3D57BA00010F7"
  temperature = 23.5
  humidity = 65.2
  co2 = 420
  voc = 120
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/sensors/air `
  -ContentType "application/json" -Body $airData

Write-Host "✅ Mensaje de aire enviado" -ForegroundColor Green
```

### 7.2. Enviar Mensaje de Ruido
```powershell
$noiseData = @{
  devEui = "eui-70B3D57BA00020F8"
  laeq = 65.5
  lai = 70.2
  laimax = 85.3
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/sensors/noise `
  -ContentType "application/json" -Body $noiseData

Write-Host "✅ Mensaje de ruido enviado" -ForegroundColor Green
```

### 7.3. Enviar Mensaje Subterráneo
```powershell
$undergroundData = @{
  devEui = "eui-70B3D57BA00030F9"
  distance = 150.5
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/sensors/underground `
  -ContentType "application/json" -Body $undergroundData

Write-Host "✅ Mensaje subterráneo enviado" -ForegroundColor Green
```

---

## 📊 Paso 8: Verificar Métricas DESPUÉS de Enviar Mensajes

### 8.1. Métricas Básicas (Debe mostrar mensajes procesados)
```powershell
$metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer
Write-Host "`nMensajes Totales: $($metrics.totalMessages)" -ForegroundColor Cyan
Write-Host "Errores Totales: $($metrics.totalErrors)" -ForegroundColor Yellow
Write-Host "Tiempo Promedio: $($metrics.averageProcessingTime)" -ForegroundColor Cyan

$metrics.byTopic | ConvertTo-Json -Depth 3
```

### 8.2. Métricas Avanzadas (Debe mostrar latencia, throughput, tamaño)
```powershell
$adv = Invoke-RestMethod http://localhost:4000/api/health/consumer/advanced

Write-Host "`n=== LATENCIA ===" -ForegroundColor Magenta
$adv.advanced.latency | Format-Table

Write-Host "`n=== THROUGHPUT ===" -ForegroundColor Magenta
$adv.advanced.throughput | ConvertTo-Json

Write-Host "`n=== TAMAÑO DE MENSAJES ===" -ForegroundColor Magenta
$adv.advanced.messageSize | Format-Table
```

**✅ Esperado:**
- `totalMessages` > 0
- `latency.p50` > 0
- `messageSize.count` > 0
- `messageSize.avgBytes` > 0

---

## ✅ Paso 9: Verificar Validaciones (Tarea B2)

### 9.1. Enviar Mensaje INVÁLIDO (devEui malo)
```powershell
$invalidData = @{
  devEui = "invalid-format"  # ❌ Formato incorrecto
  temperature = 23.5
  humidity = 65.2
  co2 = 420
  voc = 120
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/sensors/air `
    -ContentType "application/json" -Body $invalidData
  Write-Host "⚠️ No debería haber pasado validación" -ForegroundColor Yellow
} catch {
  Write-Host "✅ Validación funcionó - mensaje rechazado" -ForegroundColor Green
}
```

### 9.2. Ver Logs de Validación en Backend

En la **Terminal 2** (donde está corriendo el backend), deberías ver:
```
❌ Validación fallida para sensores.air: [
  {
    field: 'devEui',
    message: 'devEui debe tener formato eui-XXXXXXXXXXXXXXXX'
  }
]
```

---

## 📈 Paso 10: Test de Carga (Opcional)

### 10.1. Enviar 100 Mensajes
```powershell
Write-Host "Enviando 100 mensajes..." -ForegroundColor Cyan

1..100 | ForEach-Object {
  $data = @{
    devEui = "eui-70B3D57BA00010F7"
    temperature = Get-Random -Minimum 15 -Maximum 30
    humidity = Get-Random -Minimum 40 -Maximum 80
    co2 = Get-Random -Minimum 400 -Maximum 1000
    voc = Get-Random -Minimum 50 -Maximum 500
  } | ConvertTo-Json
  
  try {
    Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/sensors/air `
      -ContentType "application/json" -Body $data | Out-Null
    
    if ($_ % 10 -eq 0) {
      Write-Host "Enviados $_/100..." -ForegroundColor Green
    }
  } catch {
    Write-Host "Error en mensaje $_" -ForegroundColor Red
  }
}

Write-Host "✅ Test completado" -ForegroundColor Cyan
```

### 10.2. Ver Métricas Después del Test
```powershell
$adv = Invoke-RestMethod http://localhost:4000/api/health/consumer/advanced

Write-Host "`n=== RESULTADOS DEL TEST ===" -ForegroundColor Magenta
Write-Host "Total de mensajes: $($adv.totalMessages)"
Write-Host "Errores: $($adv.totalErrors)"
Write-Host "Tasa de error: $($adv.errorRate)"
Write-Host "Mensajes/segundo: $($adv.messagesPerSecond)"

Write-Host "`n=== LATENCIA ===" -ForegroundColor Cyan
Write-Host "P50: $($adv.advanced.latency.p50) ms"
Write-Host "P95: $($adv.advanced.latency.p95) ms"
Write-Host "P99: $($adv.advanced.latency.p99) ms"
Write-Host "Min: $($adv.advanced.latency.min) ms"
Write-Host "Max: $($adv.advanced.latency.max) ms"

Write-Host "`n=== TAMAÑO ===" -ForegroundColor Cyan
Write-Host "Promedio: $($adv.advanced.messageSize.avgBytes) bytes"
Write-Host "Total procesado: $($adv.advanced.messageSize.totalMB) MB"
```

---

## 🎯 Checklist Final de Verificación

**Infraestructura:**
- [ ] Kafka corriendo (puerto 9092)
- [ ] Zookeeper corriendo (puerto 2181)
- [ ] Backend corriendo (puerto 4000)
- [ ] MySQL conectado (Railway)
- [ ] MongoDB conectado (Atlas)

**Endpoints Básicos:**
- [ ] `/api/health` - Health check general
- [ ] `/api/health/ready` - Readiness probe
- [ ] `/api/health/live` - Liveness probe
- [ ] `/api/health/metrics` - Métricas del sistema

**Consumer Metrics (Tarea 5):**
- [ ] `/api/health/consumer` - Métricas básicas del consumer

**Métricas Avanzadas (Tarea 7 - NUEVA):**
- [ ] `/api/health/consumer/advanced` - Métricas avanzadas
- [ ] Latencia (P50, P95, P99) funcionando
- [ ] Throughput por topic funcionando
- [ ] Tamaño de mensajes funcionando
- [ ] Consumer lag tracking implementado

**Validaciones (Tarea B2):**
- [ ] Mensajes válidos se procesan correctamente
- [ ] Mensajes inválidos se rechazan
- [ ] Logs de validación funcionando
- [ ] Métricas de errores actualizándose

**Paginación (Tarea B2):**
- [ ] Query param `?page=` funciona
- [ ] Query param `?limit=` funciona
- [ ] Metadata completa en respuestas
- [ ] Límite máximo 100 se aplica

**Rate Limiting (Tarea B2):**
- [ ] Headers `RateLimit-*` presentes
- [ ] Límite general (100/15min) funciona
- [ ] Límite de escritura (30/15min) funciona
- [ ] Health checks exentos de rate limiting

---

## 🚨 Troubleshooting

### Problema: Backend no inicia
```powershell
# Verificar que no haya otro proceso en puerto 4000
netstat -ano | findstr :4000

# Si hay uno, matarlo
taskkill /PID <PID> /F
```

### Problema: Kafka no conecta
```powershell
# Verificar logs de Kafka
docker logs kafka --tail 50

# Reiniciar limpio
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\infra\kafka
docker-compose down
docker-compose up
```

### Problema: Métricas avanzadas vacías
**Causa:** No se han procesado mensajes aún.  
**Solución:** Enviar mensajes de prueba (Paso 7).

### Problema: Rate limiting no funciona
```powershell
# Verificar que express-rate-limit esté instalado
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\BackEnd
npm list express-rate-limit
```

---

## 📊 Resultados Esperados

Si todo funciona correctamente, deberías ver:

1. ✅ **7/7 tareas funcionando**
2. ✅ **Backend con 0 errores** (solo warnings de índices)
3. ✅ **Kafka consumiendo mensajes** (si hay producer)
4. ✅ **Métricas avanzadas actualizándose** en tiempo real
5. ✅ **Validaciones rechazando** mensajes inválidos
6. ✅ **Paginación funcionando** con metadata correcta
7. ✅ **Rate limiting protegiendo** endpoints

---

**Tiempo estimado:** 15-20 minutos  
**Dificultad:** Fácil (copy-paste de comandos)  
**Resultado:** Sistema 100% verificado y funcional 🎉
