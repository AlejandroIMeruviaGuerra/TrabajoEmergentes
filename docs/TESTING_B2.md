# 🧪 Testing Manual - B2 (Validaciones + Paginación + Rate Limiting)

**Fecha:** 2025-01-XX  
**Tarea:** B2  
**Estado:** Listo para testing

---

## ⚡ Quick Start

### 1. Iniciar Servicios

```powershell
# Terminal 1: Kafka
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\infra\kafka
docker-compose up

# Terminal 2: Backend (después de que Kafka esté ready)
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\BackEnd
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm start
```

**✅ Verificar:** Backend inicia sin errores, consumer conecta a Kafka

---

## 🔍 Test 1: Validaciones (Consumer)

### Objetivo
Verificar que el consumer inicia correctamente con las validaciones integradas.

### Pasos

1. **Verificar logs de inicio:**
```
[KAFKA] Consumer conectado a Kafka broker
[KAFKA] Suscrito a topics: sensores.air, sensores.noise, ...
```

2. **Verificar sin errores de validación al inicio:**
```
# NO debe aparecer:
[CONSUMER] Validación fallida para ...
```

3. **Revisar métricas del consumer:**
```powershell
Invoke-RestMethod http://localhost:4000/api/health/consumer
```

**✅ Esperado:**
```json
{
  "status": "running",
  "uptime": "00:00:XX",
  "topics": {
    "sensores.air": {
      "messagesProcessed": 0,
      "errors": 0,
      "avgProcessingTime": 0,
      "lastProcessed": null
    },
    // ... otros topics
  }
}
```

### Test con Producer (Opcional)

Si el producer funciona, enviar mensajes y verificar:

**Mensaje válido:**
```json
{
  "devEui": "eui-70B3D57BA00010F7",
  "temperature": 23.5,
  "humidity": 65.2,
  "co2": 420,
  "voc": 120
}
```
**✅ Esperado:** Procesamiento exitoso, sin logs de error

**Mensaje inválido (devEui):**
```json
{
  "devEui": "invalid-format",
  "temperature": 23.5
}
```
**❌ Esperado:**
```
[CONSUMER] Validación fallida para sensores.air, key=invalid-format: [
  { field: 'devEui', message: 'devEui debe tener formato eui-XXXXXXXXXXXXXXXX' }
]
```

**Mensaje inválido (temperatura):**
```json
{
  "devEui": "eui-70B3D57BA00010F7",
  "temperature": 150,
  "humidity": 65.2
}
```
**❌ Esperado:**
```
[CONSUMER] Validación fallida para sensores.air: [
  { field: 'temperature', message: 'temperature debe estar entre -50 y 100' }
]
```

---

## 📄 Test 2: Paginación

### Test 2.1: Primera Página (Default)

```powershell
Invoke-RestMethod http://localhost:4000/api/sensors/air
```

**✅ Esperado:**
```json
{
  "ok": true,
  "data": [ /* array de registros */ ],
  "meta": {
    "total": 1534,
    "pages": 31,
    "currentPage": 1,
    "limit": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Test 2.2: Página Específica con Límite

```powershell
Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=2&limit=10"
```

**✅ Esperado:**
```json
{
  "ok": true,
  "data": [ /* 10 registros */ ],
  "meta": {
    "total": 1534,
    "pages": 154,
    "currentPage": 2,
    "limit": 10,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Test 2.3: Límite Máximo (100)

```powershell
Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=1&limit=200"
```

**✅ Esperado:**
```json
{
  "meta": {
    "limit": 100  // Limitado automáticamente a 100
  }
}
```

### Test 2.4: Página Vacía

```powershell
Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=999999"
```

**✅ Esperado:**
```json
{
  "ok": true,
  "data": [],  // Array vacío
  "meta": {
    "currentPage": 999999,
    "hasNext": false,
    "hasPrev": true
  }
}
```

### Test 2.5: Tipos de Sensores

```powershell
# Air
Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=1&limit=5"

# Noise
Invoke-RestMethod "http://localhost:4000/api/sensors/noise?page=1&limit=5"

# Underground
Invoke-RestMethod "http://localhost:4000/api/sensors/underground?page=1&limit=5"
```

**✅ Esperado:** Todos responden con estructura similar

---

## 🚦 Test 3: Rate Limiting

### Test 3.1: Dentro del Límite (General API)

```powershell
# Hacer 10 peticiones seguidas (bien dentro del límite de 100)
1..10 | ForEach-Object { 
  $response = Invoke-RestMethod http://localhost:4000/api/sensors/air
  Write-Host "Request $_: OK, total=$($response.meta.total)"
}
```

**✅ Esperado:** Todas exitosas, status 200

### Test 3.2: Exceder Límite General (101 peticiones)

```powershell
# Hacer 101 peticiones rápidas
1..101 | ForEach-Object { 
  try { 
    $response = Invoke-RestMethod http://localhost:4000/api/sensors/air
    Write-Host "Request $_: OK" -ForegroundColor Green
  } catch { 
    Write-Host "Request $_: FAILED - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $_.Exception | Format-List -Force
  }
}
```

**❌ Esperado en petición 101:**
- Status: `429 Too Many Requests`
- Mensaje: "Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde"

**Para ver el error en detalle:**
```powershell
try {
  Invoke-RestMethod http://localhost:4000/api/sensors/air
} catch {
  $_.ErrorDetails.Message | ConvertFrom-Json
}
```

### Test 3.3: Rate Limit para POST (Write API)

```powershell
# Hacer 31 POST seguidos (límite es 30)
1..31 | ForEach-Object { 
  try {
    $body = @{
      devEui = "eui-70B3D57BA00010F7"
      temperature = 23.5
      humidity = 65.2
      co2 = 420
      voc = 120
    } | ConvertTo-Json
    
    Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/sensors/air `
      -ContentType "application/json" -Body $body
    Write-Host "POST $_: OK" -ForegroundColor Green
  } catch {
    Write-Host "POST $_: FAILED - 429" -ForegroundColor Red
  }
}
```

**❌ Esperado en POST 31:**
- Status: `429 Too Many Requests`
- Mensaje: "Demasiadas operaciones de escritura..."

### Test 3.4: Auth Limiter (Login)

```powershell
# Hacer 6 intentos de login fallidos (límite es 5)
1..6 | ForEach-Object { 
  try {
    $body = @{
      username = "fake_user"
      password = "fake_pass"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/auth/login `
      -ContentType "application/json" -Body $body
    Write-Host "Login $_: OK" -ForegroundColor Green
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 429) {
      Write-Host "Login $_: RATE LIMITED (429)" -ForegroundColor Red
    } elseif ($statusCode -eq 401) {
      Write-Host "Login $_: Auth failed (401 - expected)" -ForegroundColor Yellow
    } else {
      Write-Host "Login $_: Failed ($statusCode)" -ForegroundColor Red
    }
  }
}
```

**✅ Esperado:**
- Intentos 1-5: `401 Unauthorized` (credenciales incorrectas - esperado)
- Intento 6: `429 Too Many Requests` (rate limit)

### Test 3.5: Health Checks Exentos

```powershell
# Hacer 150 peticiones a health (no hay límite)
1..150 | ForEach-Object { 
  $response = Invoke-RestMethod http://localhost:4000/api/health
  Write-Host "Health $_: $($response.status)"
}
```

**✅ Esperado:** Todas exitosas (health checks exentos de rate limiting)

### Test 3.6: Verificar Headers de Rate Limit

```powershell
$response = Invoke-WebRequest http://localhost:4000/api/sensors/air

# Ver headers
$response.Headers['RateLimit-Limit']      # Debería mostrar: 100
$response.Headers['RateLimit-Remaining']  # Debería mostrar: 99 (o menos)
$response.Headers['RateLimit-Reset']      # Timestamp de reset
```

---

## 📊 Test 4: Integración Completa

### Escenario: Usuario Consultando Datos

```powershell
# 1. Verificar salud del sistema
$health = Invoke-RestMethod http://localhost:4000/api/health
Write-Host "Sistema: $($health.status)"

# 2. Consultar primera página de datos de aire
$page1 = Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=1&limit=10"
Write-Host "Página 1: $($page1.data.Count) registros de $($page1.meta.total)"

# 3. Consultar segunda página
$page2 = Invoke-RestMethod "http://localhost:4000/api/sensors/air?page=2&limit=10"
Write-Host "Página 2: $($page2.data.Count) registros"

# 4. Verificar metadata
Write-Host "Total páginas: $($page1.meta.pages)"
Write-Host "Tiene siguiente: $($page1.meta.hasNext)"

# 5. Consultar datos de ruido
$noise = Invoke-RestMethod "http://localhost:4000/api/sensors/noise?page=1&limit=5"
Write-Host "Ruido: $($noise.data.Count) registros"

# 6. Consultar métricas del consumer
$metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer
Write-Host "Consumer: $($metrics.status)"
```

**✅ Esperado:** Todas las peticiones exitosas, datos consistentes

---

## ✅ Checklist de Verificación

### Validaciones
- [ ] Backend inicia sin errores de sintaxis
- [ ] Consumer conecta a Kafka correctamente
- [ ] No hay logs de validación fallida al inicio (sin mensajes)
- [ ] Endpoint `/api/health/consumer` muestra metrics correctos
- [ ] (Opcional) Mensajes válidos se procesan correctamente
- [ ] (Opcional) Mensajes inválidos se rechazan con logs apropiados

### Paginación
- [ ] `GET /api/sensors/air` responde con estructura correcta
- [ ] Metadata incluye: total, pages, currentPage, limit, hasNext, hasPrev
- [ ] `?page=2&limit=10` funciona correctamente
- [ ] Límite máximo 100 se aplica automáticamente
- [ ] Página inexistente retorna array vacío (no error)
- [ ] Funciona para air, noise, underground

### Rate Limiting
- [ ] 10 peticiones seguidas funcionan sin problema
- [ ] 101 peticiones causan 429 en la #101
- [ ] 31 POST causan 429 en el #31
- [ ] 6 login causan 429 en el #6
- [ ] Health checks no tienen límite
- [ ] Headers `RateLimit-*` presentes en respuestas
- [ ] Mensaje de error en español

---

## 🐛 Troubleshooting

### Consumer no inicia
```
Error: Cannot find module 'joi'
```
**Solución:**
```powershell
cd BackEnd
npm install joi
```

### Rate limiting no funciona
```
Error: Cannot find module 'express-rate-limit'
```
**Solución:**
```powershell
cd BackEnd
npm install express-rate-limit
```

### Paginación retorna datos incorrectos
**Verificar:**
- ¿Hay datos en la tabla MySQL?
- ¿El query `SELECT COUNT(*)` funciona?

```powershell
# Ver si hay datos
Invoke-RestMethod http://localhost:4000/api/sensors/mongo/count
```

### Validation errors en consumer
**Verificar formato de mensajes del producer:**
- devEui debe ser `eui-XXXXXXXXXXXXXXXX` (16 hex chars)
- Campos numéricos dentro de rangos esperados

---

## 📝 Notas

- **Rate limiting se reinicia:** Cada 15 minutos
- **Paginación ordenamiento:** Descendente por `time` (más recientes primero)
- **Validaciones:** Mensajes inválidos se descartan (no crashean el consumer)
- **Health checks:** Siempre responden, incluso si rate limited

---

**Tiempo estimado de testing:** 15-20 minutos  
**Prioridad:** Validaciones > Paginación > Rate Limiting
