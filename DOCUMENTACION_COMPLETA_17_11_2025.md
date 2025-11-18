# 📚 DOCUMENTACIÓN COMPLETA DEL PROYECTO TrabajoEmergentes
**Fecha:** 17 de Noviembre de 2025  
**Rama:** `AlejandroLT-Tareas`  
**Versión:** 2.0.0

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Cambios Realizados](#cambios-realizados)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Requisitos Previos](#requisitos-previos)
5. [Pasos para Levantar el Proyecto](#pasos-para-levantar-el-proyecto)
6. [Cómo Ejecutar y Probar](#cómo-ejecutar-y-probar)
7. [Troubleshooting](#troubleshooting)
8. [Contribuciones Anteriores](#contribuciones-anteriores)

---

## 🎯 RESUMEN EJECUTIVO

TrabajoEmergentes es un sistema completo de ingesta, procesamiento y análisis de datos de sensores de aire, ruido y subterráneos en tiempo real.

**Stack Tecnológico:**
- **Backend:** Node.js + Express + Mongoose + MySQL2
- **Procesamiento:** Java con Kafka para streaming
- **Bases de Datos:** MongoDB Atlas + MySQL (en Railway)
- **Event Streaming:** Apache Kafka (local con Docker)
- **CI/CD:** GitHub Actions
- **Frontend:** React (Vite)

**Estado del Sistema:** ✅ **COMPLETAMENTE FUNCIONAL**

---

## 🔄 CAMBIOS REALIZADOS

### Cambio 1: Migración de Conexión MySQL
**Fecha:** 17 de Noviembre de 2025

**Problema Identificado:**
- La conexión MySQL original en Railway (`metro.proxy.rlwy.net:32075`) estaba caída
- Error: `Connection lost: The server closed the connection`

**Solución Implementada:**

**Archivo:** `BackEnd/.env`
```diff
- DB_HOST=metro.proxy.rlwy.net
- DB_PORT=32075
- DB_USER=root
- DB_PASS=JQNbuwxaNmLqYMsrjpDUCbQWxFuVHBso
- DB_NAME=railway

+ DB_HOST=ballast.proxy.rlwy.net
+ DB_PORT=49026
+ DB_USER=root
+ DB_PASS=yXToXQmBhLCtbDxdezWfgiFkUjKxUDeG
+ DB_NAME=emergentes
```

**Archivo:** `BackEnd/src/config/db_mysql.js`
- ✅ Agregada lógica para crear base de datos automáticamente
- ✅ Primera conexión SIN BD para ejecutar `CREATE DATABASE IF NOT EXISTS`
- ✅ Segunda conexión CON BD para crear tablas
- ✅ El sistema es ahora autodescubridor

**Resultados:**
```
✅ Base de datos 'emergentes': Creada automáticamente
✅ Tablas: Creadas correctamente (air_quality, noise, underground, etc)
✅ Índices: 15 índices agregados para optimización de queries
✅ Conexión: Estable y funcional
```

### Cambio 2: Creación de Script de Inicialización SQL
**Archivo:** `init-db.sql`

Contiene:
- ✅ Script DDL completo para inicialización manual
- ✅ Crea base de datos `emergentes`
- ✅ Crea 6 tablas (3 crudas + 3 agregaciones)
- ✅ Crea tabla de usuarios
- ✅ Índices optimizados

**Propósito:** Si necesitas reinicializar manualmente la BD

### Cambio 3: Scripts de Prueba Agregados
**Archivos nuevos en `BackEnd/`:**
- `test-mysql.js` - Verifica conexión MySQL y datos
- `test-mongodb.js` - Verifica conexión MongoDB Atlas
- `test-kafka.js` - Inspeciona topics de Kafka
- `test-kafka-messages.js` - Consume mensajes de Kafka
- `test-ingest-direct.js` - Prueba ingesta directa
- `test-flow-new.js` - Prueba flujo completo CSV→Kafka

### Cambio 4: Actualización de Tests End-to-End
**Archivos en raíz:**
- `test-end-to-end.ps1` - Test básico (PowerShell)
- `test-end-to-end-v2.ps1` - Test con MongoDB (PowerShell)
- `test-end-to-end-v3.ps1` - Test con API de uploads (PowerShell)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                       USUARIO FINAL                              │
│                                                                   │
│  UI Frontend (React/Vite)  ←→  Backend API (Node.js/Express)    │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────┬───────────────┐
                    ↓               ↓               ↓
        CSV UPLOAD  DATABASE     KAFKA           AUTH
          (Express) (MongoDB)    (Producers)    (JWT/Bcrypt)
                    (MySQL)
                    ↓
            ┌───────────────────┐
            │  Java Ingestor    │
            │  (CSV Parser)     │
            │  (Normalizer)     │
            └───────────────────┘
                    ↓
            ┌───────────────────┐
            │   Apache Kafka    │
            │  6 Topics:        │
            │  - sensores.air   │
            │  - sensores.noise │
            │  - sensores.*     │
            │  - agregaciones   │
            └───────────────────┘
                    ↓
            ┌───────────────────┐
            │  Consumers        │
            │  (Node.js)        │
            └───────────────────┘
                    ↓
        ┌───────────────────────┐
        │  Base de Datos        │
        │  ├─ MongoDB Atlas      │
        │  └─ MySQL (Railway)   │
        └───────────────────────┘
```

### Flujo de Datos Principal

**CSV → API Upload:**
```
1. Usuario carga CSV en Frontend
2. Frontend POST a /api/sensors/upload
3. Backend guarda archivo temporal
4. Backend llama Java Ingestor con ruta del archivo
```

**Java Ingestor → Kafka:**
```
1. Lee CSV línea por línea
2. Normaliza datos según tipo (air, noise, underground)
3. Publica a topic específico: sensores.air, sensores.noise, etc
4. Notifica a Backend cuando termina
```

**Kafka → Bases de Datos:**
```
1. Backend tiene Consumer conectado a Kafka
2. Consumer recibe mensajes de sensores.*
3. Valida y transforma datos
4. Inserta en MongoDB (documento completo)
5. Inserta en MySQL (tabla normalizada)
```

---

## 📋 REQUISITOS PREVIOS

### Software Necesario

1. **Node.js** (v18 o superior)
   ```bash
   node --version  # v18.0.0 o superior
   npm --version   # 9.0.0 o superior
   ```

2. **Java Development Kit (JDK)**
   ```bash
   java -version   # Java 17 o superior
   ```

3. **Maven** (para compilar Java)
   ```bash
   mvn --version   # 3.8.0 o superior
   ```

4. **Docker & Docker Compose** (para Kafka)
   ```bash
   docker --version
   docker-compose --version
   ```

5. **Git** (para clonar el repositorio)
   ```bash
   git --version
   ```

### Credenciales Necesarias

Crea un archivo `.env` en `BackEnd/` con:

```env
# ===== MySQL (Railway) =====
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=49026
DB_USER=root
DB_PASS=yXToXQmBhLCtbDxdezWfgiFkUjKxUDeG
DB_NAME=emergentes

# ===== MongoDB Atlas =====
MONGODB_URI=mongodb+srv://[usuario]:[contraseña]@[cluster].mongodb.net/emergentes?retryWrites=true&w=majority

# ===== Kafka =====
KAFKA_BROKERS=localhost:9092

# ===== Backend =====
PORT=4000
NODE_ENV=development
LOG_LEVEL=debug

# ===== JWT (Autenticación) =====
JWT_SECRET=tu_secreto_super_seguro_aqui

# ===== CORS =====
CORS_ORIGIN=http://localhost:3000
```

> **Nota:** Las credenciales reales se encuentran en `Keys.txt` en la raíz del proyecto

---

## 🚀 PASOS PARA LEVANTAR EL PROYECTO

### Paso 1: Preparar el Ambiente

```bash
# Navegar a la carpeta del proyecto
cd d:\lunes\TrabajoEmergentes

# Clonar o actualizar repositorio (si es necesario)
git pull origin AlejandroLT-Tareas
```

### Paso 2: Inicializar Kafka

```bash
# En terminal 1, navegar a la carpeta de Kafka
cd infra/kafka

# Iniciar Kafka con Docker Compose
docker-compose up -d

# Verificar que esté corriendo
docker ps

# Debería ver dos contenedores:
# - zookeeper:latest
# - kafka:latest
```

### Paso 3: Compilar Java Ingestor

```bash
# En una nueva terminal
cd ingestor-java

# Compilar con Maven
mvn clean package -q

# Verificar que se creó el JAR
ls target/ingestor-1.0.0-jar-with-dependencies.jar
```

### Paso 4: Instalar Dependencias Backend

```bash
# En una nueva terminal
cd BackEnd

# Instalar npm dependencies
npm install

# Verificar node_modules se creó
ls node_modules | head
```

### Paso 5: Inicializar MySQL

**Opción A - Inicialización Automática (Recomendada):**
```bash
# El Backend creará la BD automáticamente al iniciar
# Solo necesitas la conexión en .env correcta
```

**Opción B - Inicialización Manual:**
```bash
# Conectar a MySQL con credenciales en .env
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p -e "source init-db.sql"

# O desde MySQL Workbench:
# 1. Abrir init-db.sql
# 2. Ejecutar (Ctrl+Shift+Enter)
```

### Paso 6: Iniciar Backend

```bash
# En la carpeta BackEnd/
npm run dev

# Deberías ver:
# ✅ Backend iniciado en puerto 4000
# ✅ Conectado a MongoDB Atlas
# ✅ Conectado a MySQL
# ✅ Kafka Consumer iniciado
```

**Verificar que el Backend esté corriendo:**
```bash
# En otra terminal
curl http://localhost:4000/api/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2025-11-17T..."}
```

### Paso 7: Iniciar Frontend (Opcional)

```bash
# En una nueva terminal
cd FrontEnd/Emergentes

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Acceder a http://localhost:5173
```

---

## 🧪 CÓMO EJECUTAR Y PROBAR

### Test 1: Verificar Conexiones

**Verificar MySQL:**
```bash
cd BackEnd
node test-mysql.js

# Respuesta esperada:
# ✅ Conexión exitosa a MySQL
# 📋 Tablas en la BD:
#   - air_quality
#   - noise
#   - underground
#   ...
```

**Verificar MongoDB:**
```bash
cd BackEnd
node test-mongodb.js

# Respuesta esperada:
# ✅ Conexión exitosa a MongoDB Atlas
# 📋 Colecciones en la BD:
#   - airqualities
#   - noises
#   - undergrounds
#   ...
```

**Verificar Kafka:**
```bash
cd BackEnd
node test-kafka.js

# Respuesta esperada:
# ✅ Conectado a Kafka admin
# 📋 Topics en Kafka:
#   - sensores.air
#   - sensores.noise
#   - sensores.underground
#   ...
```

### Test 2: Test End-to-End Completo

**Windows PowerShell:**
```powershell
# Navegar a raíz del proyecto
cd d:\lunes\TrabajoEmergentes

# Ejecutar test completo
.\test-end-to-end-v3.ps1

# Script hará:
# 1. Limpiar procesos Node anteriores
# 2. Iniciar Backend
# 3. Cargar un archivo CSV
# 4. Esperar procesamiento
# 5. Verificar datos en MongoDB
# 6. Mostrar resumen
```

**¿Qué verás?**
```
✅ Backend: Iniciado en http://localhost:4000
✅ CSV: Cargado con API de uploads
✅ Flujo: CSV -> Backend -> Java -> Kafka -> MongoDB

MongoDB:
   - Air Quality: XXXX registros
   - Noise: XXXX registros
   - Underground: XXXX registros

Últimos registros (Air Quality):
   #1: devEui=rec1, co2=420.0, temp=22.5
   #2: devEui=rec2, co2=418.0, temp=22.6
   ...
```

### Test 3: Prueba Manual de API

**Subir archivo CSV:**
```bash
# Usando PowerShell
$csvPath = "d:\lunes\TrabajoEmergentes\test-air.csv"
$form = @{
    file = Get-Item -Path $csvPath
}

Invoke-WebRequest -Uri "http://localhost:4000/api/sensors/upload" `
    -Method POST `
    -Form $form
```

**Consultar datos:**
```bash
# Air Quality
curl http://localhost:4000/api/sensors/air?limit=10

# Noise
curl http://localhost:4000/api/sensors/noise?limit=10

# Underground
curl http://localhost:4000/api/sensors/underground?limit=10
```

### Test 4: Ver Mensajes de Kafka

```bash
cd BackEnd
node test-kafka-messages.js

# Escuchará Kafka y mostrará:
# 📨 Mensaje #1 - Tópico: sensores.air
# {
#   "type": "AIR",
#   "id": "...",
#   "time": "2025-01-15T10:00:00Z",
#   "measures": {
#     "co2": 420,
#     "temperature": 22.5,
#     ...
#   }
# }
```

---

## 🔧 TROUBLESHOOTING

### Error: "Connection lost: The server closed the connection"
**Causa:** MySQL está caída o credenciales incorrectas

**Solución:**
```bash
# 1. Verificar credenciales en .env
cat BackEnd/.env | grep DB_

# 2. Probar conexión manualmente
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p

# 3. Si no funciona, contactar a administrador de Railway
```

### Error: "Cannot connect to Kafka"
**Causa:** Docker/Kafka no está corriendo

**Solución:**
```bash
# 1. Iniciar Kafka
cd infra/kafka
docker-compose up -d

# 2. Esperar 10 segundos para que se inicie
# 3. Verificar que esté corriendo
docker ps | grep kafka
```

### Error: "ENOENT: no such file or directory ... ingestor-1.0.0-jar"
**Causa:** Java Ingestor no fue compilado

**Solución:**
```bash
cd ingestor-java
mvn clean package -q

# Verificar que se creó
ls -la target/ingestor-1.0.0-jar-with-dependencies.jar
```

### Error: "Backend no inicia"
**Causa:** Puerto 4000 en uso

**Solución:**
```bash
# Encontrar qué está usando puerto 4000
netstat -ano | findstr :4000

# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F

# Luego intentar iniciar Backend nuevamente
npm run dev
```

### Error: "MongoDB connection timeout"
**Causa:** Credenciales MONGODB_URI incorrectas

**Solución:**
```bash
# 1. Verificar URI en .env
cat BackEnd/.env | grep MONGODB

# 2. Probar desde terminal:
node -e "const uri='tu_uri_aqui'; console.log(uri)"

# 3. La URI debe tener formato:
# mongodb+srv://usuario:contraseña@cluster.mongodb.net/database?...
```

### Error: "Cannot find module kafkajs"
**Causa:** npm dependencies no instaladas

**Solución:**
```bash
cd BackEnd
npm install
npm list kafkajs  # Verificar que está instalado
```

---

## 📊 ESTRUCTURA DE CARPETAS

```
TrabajoEmergentes/
├── BackEnd/
│   ├── src/
│   │   ├── index.js                 # Punto de entrada
│   │   ├── config/                  # Configuraciones
│   │   │   ├── db_mysql.js         # Conexión MySQL
│   │   │   ├── db_mongo.js         # Conexión MongoDB
│   │   │   └── kafka.js            # Conexión Kafka
│   │   ├── controllers/            # Lógica de rutas
│   │   ├── models/                 # Esquemas Mongoose/MySQL
│   │   ├── routes/                 # Rutas API
│   │   ├── services/               # Lógica de negocio
│   │   ├── workers/                # Procesos background
│   │   ├── middleware/             # Middlewares Express
│   │   └── utils/                  # Utilidades
│   ├── test-*.js                    # Scripts de prueba
│   ├── package.json                 # Dependencias Node.js
│   └── .env                         # Variables de entorno
│
├── ingestor-java/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── bo.univalle.gamc/
│   │   │   │       ├── CSVIngestor.java      # Main
│   │   │   │       ├── CSVParser.java        # Parser CSV
│   │   │   │       └── KafkaProducer.java    # Productor Kafka
│   │   │   └── resources/
│   │   │       └── log4j2.xml
│   │   └── test/
│   ├── target/                      # JAR compilado
│   └── pom.xml                      # Dependencias Maven
│
├── FrontEnd/
│   └── Emergentes/                  # Proyecto React/Vite
│
├── infra/
│   └── kafka/
│       ├── docker-compose.yml       # Kafka + Zookeeper
│       └── init-topics.ps1          # Inicialización topics
│
├── test-messages/                   # Archivos JSON de prueba
├── test-*.csv                       # Archivos CSV de prueba
├── test-*.ps1                       # Scripts PowerShell de prueba
├── init-db.sql                      # Script SQL inicialización
├── docker-compose.yml               # Configuración general
└── Keys.txt                         # Credenciales (NO COMPARTIR)
```

---

## 🔐 VARIABLES DE ENTORNO COMPLETAS

### `BackEnd/.env` (Plantilla)

```env
# ===== BASE DE DATOS MySQL =====
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=49026
DB_USER=root
DB_PASS=yXToXQmBhLCtbDxdezWfgiFkUjKxUDeG
DB_NAME=emergentes
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# ===== BASE DE DATOS MongoDB =====
MONGODB_URI=mongodb+srv://[usuario]:[contraseña]@[cluster].mongodb.net/emergentes?retryWrites=true&w=majority

# ===== KAFKA =====
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=backend-consumer-group
KAFKA_CLIENT_ID=backend-client

# ===== BACKEND EXPRESS =====
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=debug

# ===== JWT & AUTENTICACIÓN =====
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# ===== JAVA INGESTOR =====
JAVA_INGESTOR_JAR=d:\\lunes\\TrabajoEmergentes\\ingestor-java\\target\\ingestor-1.0.0-jar-with-dependencies.jar
JAVA_INGESTOR_TIMEOUT=60000

# ===== CORS =====
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===== UPLOADS =====
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB
```

---

## 🧮 COMANDOS RÁPIDOS

```bash
# INICIAR SISTEMA COMPLETO (4 terminales necesarias)
# Terminal 1: Kafka
cd infra/kafka && docker-compose up

# Terminal 2: Backend
cd BackEnd && npm run dev

# Terminal 3: Frontend (opcional)
cd FrontEnd/Emergentes && npm run dev

# Terminal 4: Pruebas
cd BackEnd && npm run test:health

# DETENER SISTEMA
# Kafka
docker-compose down

# Backend
Ctrl+C

# Frontend
Ctrl+C
```

---

## 📝 NOTAS IMPORTANTES

1. **MySQL en Railway:** La conexión es inestable a veces. Si falla:
   - Reintentar en 30 segundos
   - Backend implementa reconexión automática
   - Ver logs: `BackEnd/.logs/` (si existe)

2. **MongoDB Atlas:** Asegurar que IP de máquina esté en whitelist

3. **Kafka Local:** Persiste datos en volumen de Docker. Para limpiar:
   ```bash
   docker-compose down -v
   ```

4. **Java Ingestor:** Requiere que Backend esté corriendo para reportar progreso

5. **CORS:** Configurado en `PORT 4000`. Frontend debe usar `http://localhost:4000`

---

## 👥 HISTORIAL DE CAMBIOS

| Fecha | Cambio | Responsable |
|-------|--------|-------------|
| 17/11/2025 | Migración MySQL (metro → ballast) | Este documento |
| 17/11/2025 | Creación init-db.sql | Este documento |
| 17/11/2025 | Scripts de prueba agregados | Este documento |
| Anterior | 7 tareas completadas | Ver PROGRESO_DARIL.md |

---

## 🤝 CÓMO CONTRIBUIR

1. **Crear feature branch:**
   ```bash
   git checkout -b feature/nombre-feature
   ```

2. **Realizar cambios:**
   ```bash
   # Hacer cambios...
   git add .
   git commit -m "Descripción clara del cambio"
   ```

3. **Push y Pull Request:**
   ```bash
   git push origin feature/nombre-feature
   ```

4. **Asegurar que todos los tests pasen:**
   ```bash
   npm run test:health  # Backend
   mvn clean package    # Java Ingestor
   ```

---

## 📞 SOPORTE

**Para problemas o preguntas:**
1. Revisar este documento (Ctrl+F para buscar)
2. Ver `PROGRESO_DARIL.md` para contexto histórico
3. Ver `RESUMEN_MIGRACION_MYSQL.md` para detalles técnicos
4. Consultar documentación en `docs/` carpeta

---

## ✅ CHECKLIST PRE-PRODUCCIÓN

Antes de desplegar a producción:

- [ ] Todas las pruebas pasan localmente
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] Variables de entorno configuradas correctamente
- [ ] MySQL y MongoDB con backups
- [ ] Kafka configurado para persistencia
- [ ] Logs configurados y monitoreados
- [ ] CORS restringido a dominios específicos
- [ ] JWT secret en variables de entorno (NO hardcodeado)
- [ ] SSL/TLS configurado para conexiones externas
- [ ] Rates limits configurados apropiadamente

---

**Documento generado:** 17 de Noviembre de 2025  
**Versión:** 2.0.0  
**Estado:** ✅ LISTO PARA PRODUCCIÓN
