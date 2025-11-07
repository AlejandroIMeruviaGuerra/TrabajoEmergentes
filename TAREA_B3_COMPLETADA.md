# ✅ TAREA B3 COMPLETADA: Health & Readiness Endpoints

**Fecha:** 7 de noviembre de 2025  
**Responsable:** Daril  
**Estado:** ✅ COMPLETADO

---

## 📝 Resumen

Se implementó un sistema completo de health checks que permite monitorear el estado de todas las dependencias del backend (MySQL, MongoDB, Kafka Consumer) con múltiples endpoints especializados para diferentes casos de uso.

---

## 🔧 Componentes Implementados

### 1. Utilidades de Health Check

**Archivo:** `src/utils/health.js`

**Funciones principales:**
- `checkMySQL()` - Verifica conexión a MySQL con latencia
- `checkMongoDB()` - Verifica conexión a MongoDB con readyState
- `checkKafkaConsumer()` - Verifica estado del consumer
- `performHealthCheck()` - Health check completo
- `performReadinessCheck()` - Readiness check (solo críticos)

**Características:**
- Estado del Kafka Consumer se mantiene en memoria
- Latencia de MySQL medida en ms
- Estados de MongoDB (connected, connecting, disconnected, disconnecting)

---

### 2. Sistema de Monitoreo de Kafka Consumer

**Archivos modificados:** `src/kafka/consumer.js`

**Cambios realizados:**
- Importación de `setKafkaConsumerStatus` de health.js
- Actualización de estado al conectar: `setKafkaConsumerStatus(true)`
- Event handlers para monitoreo:
  - `consumer.events.DISCONNECT` → marca como desconectado
  - `consumer.events.CONNECT` → marca como conectado
  - `consumer.events.CRASH` → marca como desconectado
- Función `stopConsumer()` para graceful shutdown

---

### 3. Rutas de Health

**Archivo:** `src/routes/health.routes.js`

#### **Endpoints implementados:**

**GET /api/health** - Health check completo
- Verifica: MySQL, MongoDB, Kafka Consumer
- Retorna 200 si healthy, 503 si unhealthy
- Incluye: uptime, timestamp, checks detallados, version, environment

**GET /api/health/ready** - Readiness check
- Solo verifica dependencias críticas (MySQL + Kafka)
- Útil para Kubernetes readiness probes
- Retorna 200 si ready, 503 si not ready

**GET /api/health/live** - Liveness check
- Siempre retorna 200 si el servidor está vivo
- Útil para Kubernetes liveness probes
- Incluye: uptime, timestamp, PID

**GET /api/health/metrics** - Métricas del sistema
- Uso de memoria (RSS, heap, external)
- CPU usage
- Información de Node.js (version, platform, arch)

---

### 4. Integración en el Servidor

**Archivo modificado:** `src/index.js`

**Cambios:**
- Importación de `healthRoutes`
- Importación de `stopConsumer` para shutdown
- Importación de `mongoose` y `mysqlPool` para shutdown
- Registro de rutas: `app.use("/api/health", healthRoutes)`
- Endpoint legacy mantenido para compatibilidad: `GET /health`
- **Graceful shutdown** implementado:
  - Manejo de señales SIGTERM y SIGINT
  - Cierre ordenado de: HTTP server, Kafka consumer, MySQL, MongoDB
  - Logs informativos de cada paso

---

### 5. Herramientas de Prueba

**Archivo:** `src/utils/test-health.js`

Script de prueba que verifica todos los endpoints de health:
- Health check completo
- Readiness check
- Liveness check
- Metrics

**Script npm:** `npm run test:health`

---

### 6. Documentación

**Archivo:** `BackEnd/docs/HEALTH_ENDPOINTS.md`

Documentación completa que incluye:
- Descripción de cada endpoint
- Ejemplos de respuestas (200 y 503)
- Configuración para Kubernetes (liveness/readiness probes)
- Configuración para Docker Compose (healthcheck)
- Instrucciones de prueba (cURL, browser, script)
- Criterios de salud del sistema
- Troubleshooting común
- Referencias a Kubernetes y Docker docs

---

## 📁 Archivos Creados/Modificados

### Creados (3):
1. ✅ `src/utils/health.js` - Utilidades de health check
2. ✅ `src/routes/health.routes.js` - Rutas de health
3. ✅ `src/utils/test-health.js` - Script de prueba
4. ✅ `BackEnd/docs/HEALTH_ENDPOINTS.md` - Documentación
5. ✅ `TAREA_B3_COMPLETADA.md` - Esta documentación

### Modificados (3):
1. ✅ `src/kafka/consumer.js` - Monitoreo de estado + shutdown
2. ✅ `src/index.js` - Rutas health + graceful shutdown
3. ✅ `package.json` - Script `test:health`

---

## 🚀 Cómo Usar

### Verificar Health

```bash
# Opción 1: Script de prueba
npm run test:health

# Opción 2: cURL
curl http://localhost:4000/api/health | jq
curl http://localhost:4000/api/health/ready | jq
curl http://localhost:4000/api/health/live | jq
curl http://localhost:4000/api/health/metrics | jq

# Opción 3: Browser
open http://localhost:4000/api/health
```

### Respuestas Esperadas

**Sistema Healthy (200):**
```json
{
  "status": "healthy",
  "checks": {
    "mysql": { "ok": true, "latency": 5 },
    "mongodb": { "ok": true, "state": "connected" },
    "kafkaConsumer": { "ok": true, "status": "connected" }
  }
}
```

**Sistema Unhealthy (503):**
```json
{
  "status": "unhealthy",
  "checks": {
    "mysql": { "ok": false, "error": "..." },
    "kafkaConsumer": { "ok": false, "status": "disconnected" }
  }
}
```

---

## 🎯 Definition of Done

### Criterios Cumplidos

- [x] Endpoint `/api/health` implementado
- [x] Verifica MySQL con `SELECT 1` y mide latencia
- [x] Verifica MongoDB con `readyState`
- [x] Verifica Kafka Consumer con flag en memoria
- [x] Retorna 200 si healthy, 503 si unhealthy
- [x] Incluye todos los detalles de dependencias
- [x] Endpoint `/api/health/ready` para readiness
- [x] Endpoint `/api/health/live` para liveness
- [x] Endpoint `/api/health/metrics` para métricas
- [x] Estado del consumer se actualiza en eventos
- [x] Graceful shutdown implementado
- [x] Script de prueba automatizado
- [x] Documentación completa con ejemplos
- [x] Compatible con Kubernetes/Docker

---

## 📊 Criterios de Salud

### Sistema Healthy
- ✅ MySQL conectado y responde < 100ms
- ✅ Kafka Consumer conectado y suscrito
- ⚠️ MongoDB conectado (opcional)

### Sistema Unhealthy
- ❌ MySQL desconectado o no responde
- ❌ Kafka Consumer desconectado

**Nota:** El sistema puede funcionar sin MongoDB si solo usas MySQL.

---

## 🔄 Graceful Shutdown

El sistema ahora maneja correctamente las señales de cierre:

```bash
# Ctrl+C o enviar señal
kill -SIGTERM <pid>
```

**Secuencia:**
1. 🛑 Cierra servidor HTTP (no acepta nuevas conexiones)
2. 📡 Desconecta Kafka consumer
3. 🗄️ Cierra conexión MySQL
4. 🍃 Cierra conexión MongoDB
5. 👋 Termina proceso limpiamente

**Logs esperados:**
```
🛑 SIGINT recibido, cerrando servidor...
✅ Servidor HTTP cerrado
🔴 Kafka consumer desconectado
✅ Kafka consumer desconectado correctamente
✅ MySQL desconectado
✅ MongoDB desconectado
👋 Shutdown completado
```

---

## 🏥 Uso en Producción

### Docker Compose

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

### Kubernetes

```yaml
# Liveness Probe
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 30

# Readiness Probe
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 🔍 Troubleshooting

### MySQL ok: false

**Soluciones:**
1. Verificar que MySQL está corriendo
2. Revisar variables .env (DB_HOST, DB_USER, DB_PASS)
3. Verificar conectividad de red

### kafkaConsumer ok: false

**Soluciones:**
1. Verificar Kafka: `docker ps | grep kafka`
2. Revisar KAFKA_BROKERS en .env
3. Ver logs del backend para errores Kafka

### Endpoint retorna 503

**Verificar:** Cuál dependencia está fallando en el campo `checks`

---

## 💡 Mejoras Futuras

- [ ] Integración con Prometheus (formato de métricas)
- [ ] Historial de health checks (últimos N estados)
- [ ] Alertas automáticas (email/Slack cuando unhealthy)
- [ ] Health check de servicios externos (APIs de terceros)
- [ ] Dashboard web para visualizar estado en tiempo real

---

## ✨ Beneficios

### Para Desarrollo
- ✅ Detectar problemas de conexión rápidamente
- ✅ Monitorear estado de dependencias en tiempo real
- ✅ Debuggear issues de conectividad

### Para Producción
- ✅ Kubernetes puede reiniciar pods unhealthy automáticamente
- ✅ Load balancers pueden remover instancias not ready
- ✅ Monitoring tools pueden generar alertas
- ✅ Shutdown graceful evita pérdida de datos

### Para Operaciones
- ✅ Visibilidad del estado del sistema
- ✅ Diagnóstico rápido de problemas
- ✅ Métricas de uptime y disponibilidad

---

## 📚 Referencias

- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Node.js Graceful Shutdown](https://github.com/godaddy/terminus)

---

**Tarea B3: ✅ COMPLETADA**

Sistema de health checks robusto, listo para producción y compatible con Kubernetes/Docker! 🏥✨
