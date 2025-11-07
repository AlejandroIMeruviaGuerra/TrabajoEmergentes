# 🧪 Guía de Prueba Completa - Backend + Kafka

**Duración:** 5-10 minutos  
**Objetivo:** Verificar que todo funciona (Kafka, Consumer, Métricas)

---

## 📋 **Pre-requisitos**

- ✅ Docker Desktop corriendo
- ✅ Java 17+ instalado (`java -version`)
- ✅ Maven instalado (`mvn -version`)
- ✅ Node.js instalado (`node -v`)

---

## 🔧 **Paso 1: Configurar .env (Solo primera vez)**

```powershell
cd BackEnd
```

**Si NO existe `.env`:**
```powershell
Copy-Item .env.example .env
code .env  # O notepad .env
```

**Edita estas líneas con tus credenciales:**
```bash
# MySQL Railway
DB_HOST=tu-host.railway.app
DB_USER=root
DB_PASS=tu_password
DB_NAME=railway

# MongoDB Render/Atlas
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/database

# Kafka (ya está bien)
KAFKA_BROKERS=localhost:9092
```

**Guarda y cierra el archivo**

---

## 🐳 **Paso 2: Iniciar Kafka + Zookeeper**

```powershell
# Ir a la raíz del proyecto
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes

# Limpiar Docker (opcional, solo si hay problemas)
docker compose down -v --remove-orphans

# Iniciar Kafka + Zookeeper
docker compose up -d

# Verificar que están corriendo
docker ps
```

**Esperado:**
```
CONTAINER ID   IMAGE                            STATUS
xxxxxxxxxxxx   wurstmeister/kafka:latest        Up X seconds
xxxxxxxxxxxx   wurstmeister/zookeeper:latest    Up X seconds
```

**Esperar 10-15 segundos** para que Kafka esté listo.

---

## 📊 **Paso 3: Verificar Topics de Kafka**

```powershell
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

**Esperado (6 topics):**
```
sensores.air
sensores.air.avg1m
sensores.noise
sensores.noise.avg1m
sensores.underground
sensores.underground.avg1m
```

✅ Si ves los 6 topics, **Kafka está listo!**

---

## 🟢 **Paso 4: Iniciar Backend (Consumer)**

```powershell
cd BackEnd

# Instalar dependencias (solo primera vez)
npm install

# Iniciar servidor
npm run dev
```

**Esperado en consola:**
```
🚀 Servidor escuchando en puerto 4000
✅ MySQL conectado
✅ MongoDB conectado
✅ Kafka consumer conectado
📊 Kafka Consumer Metrics: (cada 5 min)
```

**Dejar esta terminal abierta** ← Backend corriendo aquí

---

## 🧪 **Paso 5: Probar Health Endpoints (Terminal Nueva)**

Abre **PowerShell nueva** y ejecuta:

```powershell
# Endpoint principal de health
Invoke-RestMethod http://localhost:4000/api/health

# Métricas del consumer (LO MÁS IMPORTANTE)
Invoke-RestMethod http://localhost:4000/api/health/consumer

# Readiness check
Invoke-RestMethod http://localhost:4000/api/health/ready

# Liveness check
Invoke-RestMethod http://localhost:4000/api/health/live
```

**Esperado de `/api/health/consumer`:**
```json
{
  "timestamp": 1234567890,
  "uptime": "0h 0m 30s",
  "messagesProcessed": {
    "sensores.air.crude": 0,
    "sensores.noise.crude": 0,
    "sensores.underground.crude": 0,
    "sensores.air.avg1m": 0,
    "sensores.noise.avg1m": 0,
    "sensores.underground.avg1m": 0
  },
  "totalMessagesProcessed": 0,
  "totalErrors": 0
}
```

✅ **Si funciona pero totalMessages = 0, es normal** (aún no hay producer)

---

## 🚀 **Paso 6: Iniciar Streamer Java (Producer)**

Abre **otra terminal PowerShell** y ejecuta:

```powershell
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes\streamer-java

# Compilar (sin tests para ser rápido)
mvn -q -DskipTests package

# Ejecutar el JAR
java -jar target/streamer-1.0.0-jar-with-dependencies.jar -Dbootstrap.servers=localhost:9092 -Dapplication.id=gamc-streams
```

**Esperado en consola:**
```
Iniciando Kafka Streams...
Enviando mensajes a sensores.air...
Enviando mensajes a sensores.noise...
Enviando mensajes a sensores.underground...
```

**Dejar esta terminal abierta** ← Producer corriendo aquí

---

## 📊 **Paso 7: Verificar que Mensajes se Procesan**

### **Opción A: Ver logs del Backend**

En la terminal del **Backend** (npm run dev), deberías ver:

```
✅ Procesado: sensores.air.crude - devEui: eui-70B3D57ED005B94E
✅ Procesado: sensores.noise.crude - devEui: eui-70B3D57ED005B94E
✅ Procesado: sensores.underground.crude - devEui: eui-70B3D57ED005B94E
```

---

### **Opción B: Consultar métricas cada 30s**

En **terminal nueva**:

```powershell
# Consultar métricas en loop (Ctrl+C para detener)
while ($true) {
    Clear-Host
    Write-Host "📊 Métricas del Consumer - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "=" * 60
    
    $metrics = Invoke-RestMethod http://localhost:4000/api/health/consumer
    
    Write-Host "Total Mensajes: $($metrics.totalMessagesProcessed)" -ForegroundColor Green
    Write-Host "Total Errores: $($metrics.totalErrors)" -ForegroundColor $(if ($metrics.totalErrors -gt 0) { "Red" } else { "Green" })
    Write-Host "Avg Processing: $($metrics.averageProcessingTimeMs) ms" -ForegroundColor Yellow
    Write-Host "Throughput: $($metrics.messagesPerSecond) msg/s" -ForegroundColor Cyan
    Write-Host "Uptime: $($metrics.uptime)" -ForegroundColor White
    Write-Host ""
    Write-Host "Mensajes por Topic:" -ForegroundColor Cyan
    $metrics.messagesProcessed.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor White
    }
    
    Start-Sleep -Seconds 5
}
```

**Esperado (después de 30-60s):**
```
📊 Métricas del Consumer - 13:48:30
============================================================
Total Mensajes: 247
Total Errores: 0
Avg Processing: 8.34 ms
Throughput: 1.52 msg/s
Uptime: 0h 2m 15s

Mensajes por Topic:
  sensores.air.crude: 45
  sensores.noise.crude: 38
  sensores.underground.crude: 32
  sensores.air.avg1m: 44
  sensores.noise.avg1m: 37
  sensores.underground.avg1m: 51
```

✅ **Si `totalMessages` aumenta cada 5s → TODO FUNCIONA!** 🎉

---

## 🎯 **Paso 8: Verificar Datos en Base de Datos**

### **Opción A: Consultar MySQL**

```powershell
# Conecta a tu MySQL de Railway y ejecuta:
SELECT COUNT(*) FROM air_quality;
SELECT COUNT(*) FROM noise;
SELECT COUNT(*) FROM underground;
```

**Esperado:** Números crecientes de registros

---

### **Opción B: Ver logs de inserción**

En terminal del Backend, busca:
```
✅ Insertado en air_quality
✅ Insertado en noise  
✅ Insertado en underground
```

---

## 🎉 **Resumen de Éxito**

### **✅ Todo funciona si ves:**

1. **Kafka:** 
   - ✅ Contenedores corriendo (`docker ps`)
   - ✅ 6 topics creados

2. **Backend:**
   - ✅ Inicia sin errores
   - ✅ Consumer conectado a Kafka
   - ✅ MySQL + MongoDB conectados

3. **Endpoints:**
   - ✅ `/api/health` → 200 OK
   - ✅ `/api/health/consumer` → JSON con métricas

4. **Producer:**
   - ✅ Streamer-java ejecutándose
   - ✅ Logs muestran envío de mensajes

5. **Métricas:**
   - ✅ `totalMessagesProcessed` > 0
   - ✅ Incrementa cada 5-10 segundos
   - ✅ 6 topics con mensajes procesados

---

## 🛑 **Detener Todo**

```powershell
# 1. Detener Streamer Java
# → Ctrl+C en su terminal

# 2. Detener Backend
# → Ctrl+C en su terminal

# 3. Detener Kafka
cd d:\Descargas-D\emergentes-sensores\TrabajoEmergentes
docker compose down
```

---

## 🐛 **Troubleshooting**

### **Problema: Backend no inicia**
```powershell
# Verifica .env
cat BackEnd\.env

# Verifica que MySQL y MongoDB son accesibles
# (prueba conexión desde otro cliente)
```

---

### **Problema: Consumer no procesa mensajes**
```powershell
# Verifica que streamer-java está corriendo
# Verifica logs del backend para errores

# Verifica mensajes en Kafka directamente
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic sensores.air.crude \
  --from-beginning \
  --max-messages 5
```

---

### **Problema: Métricas siempre en 0**
```powershell
# Verifica que streamer-java se conecta a localhost:9092
# Verifica que backend usa KAFKA_BROKERS=localhost:9092
# Verifica que topics existen
```

---

## 📝 **Checklist Final**

- [ ] Docker Compose corriendo (kafka + zookeeper)
- [ ] 6 topics de Kafka creados
- [ ] Backend inicia sin errores
- [ ] Endpoint `/api/health` responde
- [ ] Endpoint `/api/health/consumer` muestra métricas
- [ ] Streamer-java ejecutándose
- [ ] `totalMessagesProcessed` > 0 después de 1 minuto
- [ ] Logs del backend muestran mensajes procesados
- [ ] Datos insertados en MySQL (opcional verificar)

---

**✅ Si todos los checks pasan → TAREA VALIDADA!** 🎉

---

**Tiempo Total Estimado:** 5-10 minutos  
**Responsable:** Daril  
**Branch:** Daril-Tareas  
**Estado:** 5/7 tareas (71%) → Listo para B2
