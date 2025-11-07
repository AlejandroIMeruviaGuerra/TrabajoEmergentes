# 🏥 Health Check Endpoints

Sistema de monitoreo de salud y disponibilidad del backend.

---

## 📋 Endpoints Disponibles

### 1. **GET /api/health** - Health Check Completo

Verifica el estado de todas las dependencias del sistema.

**Respuesta exitosa (200):**
```json
{
  "status": "healthy",
  "timestamp": 1699376400000,
  "uptime": 3600.5,
  "checks": {
    "mysql": {
      "ok": true,
      "latency": 5
    },
    "mongodb": {
      "ok": true,
      "state": "connected",
      "readyState": 1
    },
    "kafkaConsumer": {
      "ok": true,
      "status": "connected"
    }
  },
  "version": "1.0.0",
  "environment": "development"
}
```

**Respuesta con fallas (503):**
```json
{
  "status": "unhealthy",
  "timestamp": 1699376400000,
  "uptime": 3600.5,
  "checks": {
    "mysql": {
      "ok": true,
      "latency": 5
    },
    "mongodb": {
      "ok": false,
      "error": "Connection timeout"
    },
    "kafkaConsumer": {
      "ok": false,
      "status": "disconnected"
    }
  }
}
```

---

### 2. **GET /api/health/ready** - Readiness Check

Verifica si el servicio está listo para recibir tráfico. Solo valida dependencias críticas (MySQL + Kafka Consumer).

**Uso:** Readiness probes en Kubernetes/Docker.

**Respuesta (200 o 503):**
```json
{
  "ready": true,
  "timestamp": 1699376400000,
  "critical": {
    "mysql": true,
    "kafkaConsumer": true
  }
}
```

---

### 3. **GET /api/health/live** - Liveness Check

Verifica que el proceso esté vivo y respondiendo. Siempre devuelve 200 si el servidor está corriendo.

**Uso:** Liveness probes en Kubernetes/Docker.

**Respuesta (200):**
```json
{
  "alive": true,
  "timestamp": 1699376400000,
  "uptime": 3600.5,
  "pid": 12345
}
```

---

### 4. **GET /api/health/metrics** - Métricas del Sistema

Devuelve métricas básicas de uso de recursos.

**Respuesta (200):**
```json
{
  "timestamp": 1699376400000,
  "uptime": 3600.5,
  "memory": {
    "rss": "150.25 MB",
    "heapTotal": "120.50 MB",
    "heapUsed": "80.30 MB",
    "external": "2.10 MB"
  },
  "cpu": {
    "user": 1234567,
    "system": 234567
  },
  "node": "v20.0.0",
  "platform": "linux",
  "arch": "x64"
}
```

---

## 🔧 Configuración en Kubernetes

### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 2
```

---

## 🐳 Configuración en Docker Compose

```yaml
services:
  backend:
    image: backend:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 🧪 Probar Localmente

### Opción 1: Script de prueba
```bash
npm run test:health
```

### Opción 2: cURL
```bash
# Health completo
curl http://localhost:4000/api/health | jq

# Readiness
curl http://localhost:4000/api/health/ready | jq

# Liveness
curl http://localhost:4000/api/health/live | jq

# Métricas
curl http://localhost:4000/api/health/metrics | jq
```

### Opción 3: Browser
Abre en tu navegador:
- http://localhost:4000/api/health
- http://localhost:4000/api/health/ready
- http://localhost:4000/api/health/live
- http://localhost:4000/api/health/metrics

---

## 🔍 Estados de las Dependencias

### MySQL
- **ok: true** - Conexión exitosa, latencia < 100ms
- **ok: false** - Error de conexión o timeout

### MongoDB
- **state: "connected"** - Conectado (readyState = 1)
- **state: "connecting"** - Conectando (readyState = 2)
- **state: "disconnected"** - Desconectado (readyState = 0)
- **state: "disconnecting"** - Desconectando (readyState = 3)

### Kafka Consumer
- **status: "connected"** - Consumer activo y suscrito
- **status: "disconnected"** - Consumer desconectado o no iniciado

---

## 📊 Criterios de Salud

### Sistema "Healthy" (200)
- ✅ MySQL conectado
- ✅ Kafka Consumer conectado
- ⚠️ MongoDB conectado (opcional)

### Sistema "Unhealthy" (503)
- ❌ MySQL desconectado
- ❌ Kafka Consumer desconectado

**Nota:** MongoDB es opcional. El sistema puede funcionar sin MongoDB si solo se usa MySQL.

---

## 🛠️ Troubleshooting

### Error: "mysql": { "ok": false }

**Causa:** MySQL no está disponible o credenciales incorrectas.

**Solución:**
1. Verificar que MySQL esté corriendo
2. Revisar variables de entorno (DB_HOST, DB_USER, DB_PASS)
3. Verificar firewall/red

### Error: "kafkaConsumer": { "ok": false }

**Causa:** Kafka no está disponible o el consumer no se conectó.

**Solución:**
1. Verificar que Kafka esté corriendo: `docker ps | grep kafka`
2. Verificar KAFKA_BROKERS en .env
3. Revisar logs del backend para errores de Kafka

### Endpoint retorna 503 pero MongoDB está desconectado

**Comportamiento esperado:** El sistema marca "unhealthy" si MongoDB falla, pero puede seguir funcionando si solo usas MySQL.

**Solución:** Si no usas MongoDB, puedes modificar el health check para ignorarlo.

---

## 🔄 Graceful Shutdown

El sistema maneja señales SIGTERM y SIGINT para cerrar conexiones correctamente:

```bash
# Presiona Ctrl+C o envía señal
kill -SIGTERM <pid>
```

**Secuencia de shutdown:**
1. Cierra servidor HTTP (deja de aceptar nuevas conexiones)
2. Desconecta Kafka consumer
3. Cierra conexión MySQL
4. Cierra conexión MongoDB
5. Termina proceso

---

## 📈 Monitoreo y Alertas

### Prometheus (futuro)

Puedes exponer métricas en formato Prometheus:

```javascript
// Agregar endpoint /metrics en formato Prometheus
app.get('/metrics', prometheusMiddleware);
```

### Grafana Dashboard (futuro)

Visualizar métricas de:
- Uptime
- Uso de memoria
- Latencia de health checks
- Estado de dependencias

---

## 📚 Referencias

- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Última actualización:** 7 de noviembre de 2025  
**Responsable:** Daril - Backend Core
