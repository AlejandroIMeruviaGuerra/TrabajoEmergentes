# 📋 RESUMEN DE CAMBIOS - Proyecto TrabajoEmergentes

**Fecha:** 9 de noviembre de 2025  
**Branch:** Daril-Tareas  
**Autor:** Daril

---

## 🎯 TAREAS COMPLETADAS (7/7 = 100%)

### ✅ TAREA A1: Infraestructura Kafka
**Archivos creados/modificados:**
- `docker-compose.yml` - Configuración de Kafka + Zookeeper
- `infra/kafka/init-topics.ps1` - Script PowerShell para crear 6 topics
- `infra/kafka/init-topics.sh` - Script Bash para crear 6 topics

**Detalles:**
- 3 topics crude: `sensores.air`, `sensores.noise`, `sensores.underground`
- 3 topics agregados: `sensores.air.avg1m`, `sensores.noise.avg1m`, `sensores.underground.avg1m`

---

### ✅ TAREA B1: Índices SQL
**Archivo modificado:**
- `BackEnd/src/config/db_mysql.js`

**Índices creados (15 total):**
- **air_quality (4):** idx_time, idx_devEui, idx_location, idx_air_quality
- **noise (4):** idx_noise_time, idx_noise_devEui, idx_noise_location, idx_noise_level
- **underground (4):** idx_underground_time, idx_underground_devEui, idx_underground_location, idx_distance
- **air_quality_agg_1m (3):** idx_agg_air_time, idx_agg_air_devEui, idx_agg_air_location
- **noise_agg_1m (3):** idx_agg_noise_time, idx_agg_noise_devEui, idx_agg_noise_location
- **underground_agg_1m (3):** idx_agg_underground_time, idx_agg_underground_devEui, idx_agg_underground_location

---

### ✅ TAREA A2: CI/CD
**Archivo creado:**
- `.github/workflows/ci.yml`

**Detalles:**
- Workflow de GitHub Actions para Node.js
- Se ejecuta en push y pull requests a main
- Instala dependencias y ejecuta tests

---

### ✅ TAREA B3: Health Endpoints
**Archivo modificado:**
- `BackEnd/src/routes/health.routes.js`

**Endpoints implementados (6 total):**
1. `GET /api/health` - Salud general (MySQL, MongoDB, Kafka)
2. `GET /api/health/ready` - Readiness check
3. `GET /api/health/live` - Liveness check
4. `GET /api/health/metrics` - Métricas del sistema (memoria, CPU)
5. `GET /api/health/consumer` - Métricas básicas del consumer Kafka
6. `GET /api/health/consumer/advanced` - Métricas avanzadas del consumer (NUEVO)

---

### ✅ TAREA 5: Consumer Health (Telemetría)
**Archivo creado:**
- `BackEnd/src/kafka/metrics.js` - Clase ConsumerMetrics

**Funcionalidades:**
- Tracking de mensajes procesados por topic
- Conteo de errores por topic
- Tiempo promedio de procesamiento
- Timestamp del último mensaje
- Export de métricas para health endpoints

---

### ✅ TAREA B2: Validaciones + Paginación + Rate Limiting

#### **Validaciones Joi**
**Archivo creado:**
- `BackEnd/src/kafka/schemas/sensor.schemas.js`

**Schemas creados (6):**
1. `airCrudeSchema` - Validación para sensores de aire
2. `noiseCrudeSchema` - Validación para sensores de ruido
3. `undergroundCrudeSchema` - Validación para sensores subterráneos
4. `airAggregatedSchema` - Validación para datos agregados de aire
5. `noiseAggregatedSchema` - Validación para datos agregados de ruido
6. `undergroundAggregatedSchema` - Validación para datos agregados subterráneos

**Integración:**
- `BackEnd/src/kafka/consumer.js` - Integrado en el consumer para validar todos los mensajes antes de procesarlos

#### **Paginación**
**Archivos modificados:**
- `BackEnd/src/services/ingest.service.js` - Función `fetchPaginated(type, page, limit)`
- `BackEnd/src/controllers/sensors.controller.js` - Método `listByType()` modificado

**Metadata incluido:**
- `total` - Total de registros
- `pages` - Número total de páginas
- `currentPage` - Página actual
- `limit` - Límite de registros por página
- `hasNext` - Booleano si hay página siguiente
- `hasPrev` - Booleano si hay página anterior

#### **Rate Limiting**
**Archivo creado:**
- `BackEnd/src/middleware/rateLimiter.js`

**Rate limiters creados (3):**
1. `apiLimiter` - 100 requests / 15 min (general)
2. `writeApiLimiter` - 30 requests / 15 min (escritura)
3. `authLimiter` - 5 requests / 15 min (autenticación)

**Archivos donde se aplicó:**
- `BackEnd/src/routes/sensors.routes.js`
- `BackEnd/src/routes/auth.routes.js`
- `BackEnd/src/routes/uploads.routes.js`

---

### ✅ TAREA 7: Métricas Kafka Avanzadas (BONUS)

**Archivo modificado:**
- `BackEnd/src/kafka/metrics.js` - Extendida clase ConsumerMetrics (~250 líneas adicionales)

**Nuevas funcionalidades implementadas:**

#### **1. Latency Histograms (Percentiles)**
- `recordLatency(latencyMs)` - Registra latencia de procesamiento
- `getLatencyHistogram()` - Retorna P50, P95, P99, min, max
- Buffer circular de 1000 latencias

#### **2. Throughput por Topic**
- `recordMessageTimestamp(topic)` - Registra timestamp del mensaje
- `getThroughputByTopic()` - Calcula mensajes/segundo en ventana deslizante de 60s
- Limpieza automática de timestamps antiguos

#### **3. Message Size Statistics**
- `recordMessageSize(sizeInBytes)` - Registra tamaño del mensaje
- `getMessageSizeStats()` - Retorna count, totalBytes, avgBytes, minBytes, maxBytes, totalMB
- Buffer circular de 1000 tamaños

#### **4. Batch Statistics**
- `recordBatch(batchSize)` - Registra tamaño de batch
- `getBatchStats()` - Retorna totalBatches, avgBatchSize, minBatchSize, maxBatchSize
- Buffer circular de 100 batches

#### **5. Consumer Lag Tracking**
- `updateConsumerLag(topic, partition, lag)` - Actualización manual de lag
- `getConsumerLag()` - Retorna lag por topic/partition con status (up-to-date, healthy, lagging)
- Almacenamiento en Map de lag por topic

#### **6. Métodos Auxiliares**
- `initAdvancedMetrics()` - Inicializa buffers y estructuras
- `calculatePercentile(sortedArray, percentile)` - Calcula percentiles
- `getAdvancedMetrics()` - Retorna todas las métricas avanzadas
- `getAllMetrics()` - Combina métricas básicas + avanzadas

**Integración:**
- `BackEnd/src/kafka/consumer.js` - Instrumentado con llamadas a todas las nuevas métricas
- `BackEnd/src/routes/health.routes.js` - Nuevo endpoint `/api/health/consumer/advanced`

**Documentación creada:**
- `docs/TAREA_7_METRICAS_AVANZADAS.md` - Documentación completa de la implementación

---

## 🔧 CAMBIOS ADICIONALES (No parte de las tareas originales)

### **Modificación en ingest.service.js**
**Archivo modificado:**
- `BackEnd/src/config/ingest.service.js`

**Funciones modificadas:**
- `toMysqlAir(row)` - Soporte para formato plano Y anidado
- `toMysqlNoise(row)` - Soporte para formato plano Y anidado
- `toMysqlUnderground(row)` - Soporte para formato plano Y anidado

**Problema resuelto:**
Los schemas Joi validan mensajes con formato plano (`devEui`, `temperature`, `co2`), pero las funciones de mapeo MySQL esperaban formato anidado (`device.devEui`, `measures.temperature`, `measures.co2`). Esto causaba que los datos se insertaran con todos los campos en NULL.

**Solución implementada:**
Se agregaron fallbacks usando el operador `||` para buscar valores en ambos formatos:
```javascript
// Antes
devEui: row.device?.devEui || null,

// Después
devEui: row.device?.devEui || row.devEui || null,
```

**Campos modificados:**
- `devEui` - Busca en `row.device.devEui` OR `row.devEui`
- `address` - Busca en `row.location.address` OR `row.locationName`
- `co2`, `temperature`, `humidity`, `pressure` - Busca en `row.measures.X` OR `row.X`
- `laeq`, `lai`, `laimax` - Busca en `row.measures.X` OR `row.X`
- `distance` - Busca en `row.measures.distance` OR `row.distance`

**Beneficios:**
- ✅ Soporta mensajes con estructura anidada (sistema real)
- ✅ Soporta mensajes con estructura plana (pruebas/validación Joi)
- ✅ No rompe funcionalidad existente
- ✅ Más flexible y robusto

---

## 📦 PAQUETES NPM INSTALADOS

**Nuevas dependencias:**
```json
{
  "joi": "^18.0.1",
  "express-rate-limit": "^8.2.1"
}
```

---

## 📁 ARCHIVOS DE PRUEBA CREADOS

**Directorio:** `test-messages/`

**Archivos creados:**
1. `air-test-oneline.json` - Mensaje de prueba air quality (formato plano, 1 línea)
2. `noise-test-oneline.json` - Mensaje de prueba noise (formato plano, 1 línea)
3. `underground-test-oneline.json` - Mensaje de prueba underground (formato plano, 1 línea)
4. `air-nested.json` - Mensaje de prueba air quality (formato anidado)
5. `noise-nested.json` - Mensaje de prueba noise (formato anidado)
6. `underground-nested.json` - Mensaje de prueba underground (formato anidado)

**Script de prueba:**
- `test-rate-limit.ps1` - Script PowerShell para probar rate limiting (105 requests)

---

## 📚 DOCUMENTACIÓN CREADA

**Archivos nuevos:**
1. `docs/TAREA_7_METRICAS_AVANZADAS.md` - Documentación completa de métricas avanzadas
2. `docs/TAREA_B2_COMPLETADA.md` - Documentación de validaciones + paginación + rate limiting
3. `docs/GUIA_VERIFICACION_COMPLETA.md` - Guía paso a paso para verificar todas las tareas
4. `PROGRESO_DARIL.md` - Seguimiento de progreso (actualizado a 100%)
5. `RESUMEN_CAMBIOS.md` - Este archivo

---

## ✅ PRUEBAS REALIZADAS

### **1. Paginación**
- ✅ Consultadas páginas 1 y 2 con límite 1
- ✅ Metadata correcto: `hasNext`, `hasPrev`, `total`, `pages`

### **2. Rate Limiting**
- ✅ 98 requests exitosos
- ✅ 7 requests bloqueados (429 Too Many Requests)
- ✅ Bloqueó correctamente en request #99

### **3. Métricas Avanzadas**
- ✅ Latency: P50=3ms, P95=18ms, P99=18ms
- ✅ Throughput: 0.02 msg/s por topic
- ✅ Message Size: avg=136 bytes, min=115, max=157
- ✅ Consumer Lag: status "up-to-date"

### **4. Health Endpoints**
- ✅ `/api/health` - MySQL, MongoDB, Kafka conectados
- ✅ `/api/health/ready` - Ready: true
- ✅ `/api/health/live` - Alive: true
- ✅ `/api/health/metrics` - Memory: 80MB, Node v22.20.0
- ✅ `/api/health/consumer` - Métricas básicas
- ✅ `/api/health/consumer/advanced` - Métricas avanzadas

### **5. Kafka Consumer**
- ✅ 3 mensajes procesados (air, noise, underground)
- ✅ 0 errores de validación
- ✅ Datos insertados correctamente en MySQL con todos los campos

### **6. Validación Joi**
- ✅ Mensajes válidos procesados correctamente
- ✅ Mensajes inválidos rechazados (28 errores de pruebas anteriores)

---

## 🎯 ESTADO FINAL

**Código:**
- ✅ 7 tareas completadas al 100%
- ✅ 1 mejora adicional (mapeo MySQL flexible)
- ✅ Sistema totalmente funcional y probado

**Repositorio:**
- Branch: `Daril-Tareas`
- Commits: Múltiples commits incrementales
- Estado: Listo para merge o revisión

**Sistema:**
- ✅ Kafka + Zookeeper corriendo en Docker
- ✅ Backend corriendo en puerto 4000
- ✅ MySQL conectado (Railway)
- ✅ MongoDB conectado (Atlas)
- ✅ Consumer procesando mensajes correctamente

---

## 📝 NOTAS IMPORTANTES

1. **Modificación de ingest.service.js**: Este archivo NO era parte de las tareas originales. Se modificó para corregir un problema de compatibilidad entre los schemas Joi (formato plano) y el mapeo MySQL (formato anidado).

2. **Archivos de prueba**: Los archivos en `test-messages/` son solo para testing y NO deben usarse en producción.

3. **Rate Limiting**: Los límites configurados son conservadores. Pueden ajustarse según necesidades de producción.

4. **Métricas avanzadas**: Los buffers tienen tamaños limitados (1000 latencias, 1000 tamaños, 100 batches) para evitar consumo excesivo de memoria.

5. **Consumer Lag**: Actualmente se actualiza manualmente. Para producción, considerar implementar auto-fetch desde Kafka.

---

**Fin del documento**
