# ⚡ GUÍA RÁPIDA - START HERE!
**Fecha:** 17 de Noviembre de 2025  
**Tiempo de lectura:** 5 minutos

> 👉 **COMIENZA AQUÍ** si es tu primera vez con el proyecto

---

## 🎯 ¿Qué Es Este Proyecto?

Sistema completo para procesar datos de sensores (aire, ruido, subterráneo) en tiempo real.

**Flujo Principal:**
```
Tu CSV → Backend → Java Ingestor → Kafka → Bases de Datos
```

---

## ⚙️ REQUISITOS (5 MINUTOS)

### Instalar (si NO tienes):

```bash
# 1. Node.js (https://nodejs.org/)
node --version  # Debe ser v18+

# 2. Java (https://www.oracle.com/java/technologies/)
java -version   # Debe ser 17+

# 3. Maven (https://maven.apache.org/)
mvn --version

# 4. Docker (https://www.docker.com/)
docker --version

# 5. Git (https://git-scm.com/)
git --version
```

Si ya los tienes instalados, **SALTAR esta sección**.

---

## 🚀 LEVANTAR TODO (10 MINUTOS)

### En 4 Terminales Diferentes (PowerShell):

**Terminal 1 - Kafka (deja corriendo):**
```powershell
cd d:\lunes\TrabajoEmergentes\infra\kafka
docker-compose up
```
Esperar a que diga: `INFO [Controller 1] [Broker] Broker 1 is offline`

**Terminal 2 - Compilar Java (1 minuto):**
```powershell
cd d:\lunes\TrabajoEmergentes\ingestor-java
mvn clean package -q
```
Deberías ver: `BUILD SUCCESS`

**Terminal 3 - Backend (deja corriendo):**
```powershell
cd d:\lunes\TrabajoEmergentes\BackEnd
npm install  # Primera vez solamente
npm run dev
```
Deberías ver:
```
✅ Backend iniciado en puerto 4000
✅ Conectado a MongoDB
✅ Conectado a MySQL
✅ Kafka Consumer conectado
```

**Terminal 4 - Pruebas:**
```powershell
cd d:\lunes\TrabajoEmergentes

# Opción A: Test automático completo
.\test-end-to-end-v3.ps1

# Opción B: Cargar tu propio CSV (manual)
$form = @{ file = Get-Item "test-air.csv" }
Invoke-WebRequest -Uri "http://localhost:4000/api/sensors/upload" -Method POST -Form $form
```

---

## ✅ ¿FUNCIONA? DEBERÍAS VER:

### En MongoDB:
```
Air Quality: XXXX registros
Noise: XXXX registros
Underground: XXXX registros
```

### En MySQL:
```
air_quality: XXXX filas
noise: XXXX filas
underground: XXXX filas
```

### En Kafka (mensajes):
```
📨 Mensaje #1 - Tópico: sensores.air
{
  "type": "AIR",
  "measures": { "co2": 420, "temperature": 22.5, ... }
}
```

---

## 🆘 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| "Connection refused" | Asegurar que Kafka esté running (`docker ps`) |
| "Cannot find jar" | Compilar Java: `mvn clean package` |
| "Port 4000 in use" | `Get-Process node \| Stop-Process -Force` |
| "MONGODB_URI invalid" | Ver Variables de Entorno abajo |
| "Database doesn't exist" | Backend lo crea automáticamente al iniciar |

---

## 📁 VARIABLES DE ENTORNO

Crear archivo: `BackEnd/.env`

```env
# MySQL (Railway) - CAMBIO RECIENTE
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=49026
DB_USER=root
DB_PASS=yXToXQmBhLCtbDxdezWfgiFkUjKxUDeG
DB_NAME=emergentes

# MongoDB Atlas
MONGODB_URI=mongodb+srv://[usuario]:[pwd]@[cluster].mongodb.net/emergentes?retryWrites=true&w=majority

# Kafka
KAFKA_BROKERS=localhost:9092

# Backend
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=cambiar_esto_en_produccion

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

> Credenciales completas: Ver `Keys.txt` en raíz

---

## 🧪 VERIFICAR RÁPIDAMENTE

```bash
cd BackEnd

# ¿Conecta a todo?
node verify-connections.js

# ¿Datos en MongoDB?
node test-mongodb.js

# ¿Datos en MySQL?
node test-mysql.js

# ¿Kafka funciona?
node test-kafka.js
```

---

## 📊 API ENDPOINTS PRINCIPALES

```bash
# Upload CSV
POST http://localhost:4000/api/sensors/upload
  Body: multipart/form-data file

# Ver datos Air Quality
GET http://localhost:4000/api/sensors/air?limit=10

# Ver datos Noise
GET http://localhost:4000/api/sensors/noise?limit=10

# Ver datos Underground
GET http://localhost:4000/api/sensors/underground?limit=10

# Health Check
GET http://localhost:4000/api/health

# Autenticación
POST http://localhost:4000/api/auth/login
  Body: { username, password }
```

---

## 📚 DOCUMENTACIÓN DETALLADA

Para información completa, ver:

1. **`DOCUMENTACION_COMPLETA_17_11_2025.md`** ← TODO EL PROYECTO
   - Arquitectura
   - Todos los cambios
   - Troubleshooting completo

2. **`GUIA_PRUEBAS_PRACTICAS_17_11_2025.md`** ← CÓMO PROBAR
   - Pruebas unitarias
   - Tests end-to-end
   - Pruebas de carga

3. **`PROGRESO_DARIL.md`** ← HISTORIAL
   - 7 tareas completadas
   - Contexto histórico

---

## 🔄 FLUJO TÍPICO

```
1. Preparar CSV con datos de sensores
2. Iniciar Backend (npm run dev)
3. Iniciar Kafka (docker-compose up)
4. Cargar CSV: POST /api/sensors/upload
5. Backend llama Java Ingestor
6. Java lee CSV → publica a Kafka
7. Backend consume desde Kafka
8. Datos se guardan en MySQL + MongoDB
9. Ver resultados en API endpoints
```

---

## 💾 BASES DE DATOS

### MySQL (Railway)
```
Host: ballast.proxy.rlwy.net:49026
User: root
DB: emergentes
Tablas: air_quality, noise, underground, users, agregaciones
```

### MongoDB Atlas
```
Colecciones: airqualities, noises, undergrounds
Documentos completos con medidas, etiquetas, etc
```

### Kafka
```
Topics:
- sensores.air, sensores.noise, sensores.underground (crudos)
- sensores.air.avg1m, sensores.noise.avg1m, etc (agregaciones)
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Dónde pongo mis credenciales?**  
R: En `BackEnd/.env` (no compartir este archivo)

**P: ¿Cómo cargo mis propios CSVs?**  
R: POST a `/api/sensors/upload` con el archivo

**P: ¿Dónde veo los datos?**  
R: MySQL: `air_quality`, MongoDB: `airqualities`, Kafka: topics

**P: ¿Qué hago si falla algo?**  
R: Ver sección "Problemas Comunes" arriba

**P: ¿Cómo paro todo?**  
R: Ctrl+C en cada terminal, luego `docker-compose down` en Kafka

---

## 🎓 FLUJO DE APRENDIZAJE

1. **Primero:** Lee esta guía (5 min)
2. **Luego:** Levanta todo (10 min)
3. **Prueba:** Carga un CSV (2 min)
4. **Explora:** Ve los datos en MongoDB/MySQL (5 min)
5. **Profundiza:** Lee DOCUMENTACION_COMPLETA_17_11_2025.md

---

## 🏁 ¿LISTO?

```bash
# 1. Kafka
cd infra/kafka && docker-compose up

# 2. Java (en otra terminal)
cd ingestor-java && mvn clean package

# 3. Backend (en otra terminal)
cd BackEnd && npm run dev

# 4. Test (en otra terminal)
.\test-end-to-end-v3.ps1
```

**¡Eso es todo! El sistema debería estar corriendo** ✅

---

## 📞 RECURSOS

- **Documentación Técnica:** `DOCUMENTACION_COMPLETA_17_11_2025.md`
- **Guía de Pruebas:** `GUIA_PRUEBAS_PRACTICAS_17_11_2025.md`
- **Cambios Recientes:** `RESUMEN_MIGRACION_MYSQL.md`
- **Historial:** `PROGRESO_DARIL.md`

---

**¡Éxito! Contacta si necesitas ayuda.** 🚀

Última actualización: 17 de Noviembre de 2025
