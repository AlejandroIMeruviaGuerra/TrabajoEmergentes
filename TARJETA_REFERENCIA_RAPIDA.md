# 🎯 TARJETA DE REFERENCIA RÁPIDA
**Imprime esta página o guárdala en un tab del navegador**

---

## ⚡ COMANDOS ESENCIALES

### Levantar Sistema Completo (4 Terminales)

```bash
# Terminal 1: Kafka
cd infra/kafka
docker-compose up
```

```bash
# Terminal 2: Java (compilar una sola vez)
cd ingestor-java
mvn clean package -q
```

```bash
# Terminal 3: Backend
cd BackEnd
npm install        # Primera vez
npm run dev        # Luego
```

```bash
# Terminal 4: Test
cd BackEnd
node test-mysql.js          # Verificar MySQL
node test-mongodb.js        # Verificar MongoDB
node test-kafka.js          # Verificar Kafka
```

### O Ejecutar Test Completo

```powershell
# Windows PowerShell (desde raíz)
.\test-end-to-end-v3.ps1
```

---

## 🔑 CREDENCIALES

**Archivo:** `BackEnd/.env`

```env
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=49026
DB_USER=root
DB_PASS=yXToXQmBhLCtbDxdezWfgiFkUjKxUDeG
DB_NAME=emergentes

MONGODB_URI=mongodb+srv://[usuario]:[pwd]@[cluster].mongodb.net/emergentes...
KAFKA_BROKERS=localhost:9092

JWT_SECRET=tu_secreto_aqui
PORT=4000
```

---

## 🌐 ENDPOINTS PRINCIPALES

```bash
# Upload CSV
POST http://localhost:4000/api/sensors/upload
Header: Content-Type: multipart/form-data

# Ver datos
GET http://localhost:4000/api/sensors/air?limit=10
GET http://localhost:4000/api/sensors/noise?limit=10
GET http://localhost:4000/api/sensors/underground?limit=10

# Health
GET http://localhost:4000/api/health
GET http://localhost:4000/api/health/live
GET http://localhost:4000/api/health/ready
```

---

## 📊 VERIFICAR DATOS

### MySQL
```bash
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p emergentes

# Contar registros
SELECT COUNT(*) FROM air_quality;
SELECT COUNT(*) FROM noise;
SELECT COUNT(*) FROM underground;

# Ver últimos
SELECT * FROM air_quality ORDER BY time DESC LIMIT 5;
```

### MongoDB
```bash
# Terminal (desde BackEnd/)
node test-mongodb.js
```

### Kafka
```bash
# Terminal (desde BackEnd/)
node test-kafka-messages.js
```

---

## 🆘 PROBLEMAS RÁPIDOS

| Problema | Solución |
|----------|----------|
| "Connection refused" | `docker ps` → si no está Kafka: `docker-compose up` |
| "Port 4000 in use" | `Get-Process node \| Stop-Process -Force` |
| "Cannot find jar" | `cd ingestor-java && mvn clean package -q` |
| "ENOENT" | Asegurar que estás en carpeta correcta |
| "MONGODB_URI invalid" | Ver credenciales en `Keys.txt` |
| "Database doesn't exist" | Backend lo crea automáticamente |

---

## 📁 ARCHIVOS IMPORTANTES

```
📁 BackEnd/
├─ .env              ← CREDENCIALES (NO COMPARTIR)
├─ src/
│  ├─ index.js       ← PUNTO DE ENTRADA
│  └─ config/        ← Conexiones BD
├─ test-*.js         ← SCRIPTS DE PRUEBA
└─ package.json      ← DEPENDENCIAS

📁 ingestor-java/
├─ pom.xml           ← DEPENDENCIAS JAVA
├─ src/
│  └─ main/java/     ← CÓDIGO JAVA
└─ target/
   └─ ingestor-1.0.0-jar-with-dependencies.jar

📁 infra/kafka/
├─ docker-compose.yml ← KAFKA + ZOOKEEPER
└─ init-topics.ps1   ← INICIALIZAR TOPICS

📄 init-db.sql       ← INICIALIZACIÓN MANUAL BD
```

---

## 📚 DOCUMENTOS PRINCIPALES

```
1. GUIA_RAPIDA_START_HERE.md
   └─ 5 min | Para empezar

2. DOCUMENTACION_COMPLETA_17_11_2025.md
   └─ 40 min | Referencia técnica

3. GUIA_PRUEBAS_PRACTICAS_17_11_2025.md
   └─ 30 min | Scripts y ejemplos

4. CAMBIOS_TECNICOS_DETALLADOS_17_11_2025.md
   └─ 20 min | Qué cambió exactamente

5. INDICE_DOCUMENTACION_17_11_2025.md
   └─ 10 min | Índice general
```

---

## ✅ CHECKLIST DIARIO

Antes de empezar trabajo:

- [ ] Kafka corriendo: `docker ps | grep kafka`
- [ ] Backend corriendo: `curl http://localhost:4000/api/health`
- [ ] MySQL accesible: `node test-mysql.js`
- [ ] MongoDB accesible: `node test-mongodb.js`

---

## 🚀 LEVANTAR + PROBAR (15 MINUTOS)

```bash
# 1. Kafka (1 min)
cd infra/kafka && docker-compose up -d

# 2. Java (si no está compilado - 2 min)
cd ingestor-java && mvn clean package -q

# 3. Backend (5 min)
cd BackEnd && npm run dev

# 4. Test (esperar en otra terminal - 5 min)
# Esperar a que Backend diga "✅ Iniciado"
cd BackEnd && node test-mysql.js

# 5. Prueba de carga (10 min)
.\test-end-to-end-v3.ps1
```

**Total: 15-20 minutos de operación**

---

## 🔄 FLUJO DE DATOS

```
tu CSV
   ↓
POST /api/sensors/upload
   ↓
Backend recibe
   ↓
Ejecuta Java Ingestor
   ↓
Kafka recibe mensajes
   ↓
Backend consume desde Kafka
   ↓
Inserta en MongoDB + MySQL
   ↓
✅ Datos disponibles
```

---

## 🎓 ORDEN DE LECTURA RECOMENDADO

```
1. Esta tarjeta (2 min)
   ↓
2. GUIA_RAPIDA_START_HERE.md (5 min)
   ↓
3. Levantar sistema (10 min)
   ↓
4. DOCUMENTACION_COMPLETA_17_11_2025.md (40 min)
   ↓
5. GUIA_PRUEBAS_PRACTICAS_17_11_2025.md (30 min)
   ↓
6. CAMBIOS_TECNICOS_DETALLADOS_17_11_2025.md (20 min)
```

---

## 🐛 DEBUG RÁPIDO

### Ver logs Backend
```bash
# En terminal donde Backend corre, verás logs
# O en archivo (si existe): BackEnd/.logs/
```

### Ver logs Java
```bash
# Cuando ejecuta ingestor, muestra logs en terminal
```

### Ver logs Kafka
```bash
# docker logs kafka    # En otra terminal
# docker logs zookeeper
```

---

## 🌍 CONEXIONES PRINCIPALES

```
MySQL: ballast.proxy.rlwy.net:49026/emergentes
MongoDB: [cluster].mongodb.net/emergentes
Kafka: localhost:9092 (6 topics)
Backend: localhost:4000
Frontend: localhost:5173 (si aplica)
```

---

## 💾 BASES DE DATOS

### MySQL - 3 tablas crudas + 3 agregaciones
```
air_quality      (datos crudos de aire)
noise            (datos crudos de ruido)
underground      (datos crudos subterráneo)

air_quality_agg_1m      (agregación 1 minuto)
noise_agg_1m
underground_agg_1m
```

### MongoDB - 3 colecciones
```
airqualities     (documentos completos aire)
noises           (documentos completos ruido)
undergrounds     (documentos completos subterráneo)
```

### Kafka - 6 topics
```
sensores.air              (crudo)
sensores.noise            (crudo)
sensores.underground      (crudo)
sensores.air.avg1m        (agregado)
sensores.noise.avg1m      (agregado)
sensores.underground.avg1m (agregado)
```

---

## 🎯 DECISIONES RÁPIDAS

**¿Cómo cargo un CSV?**
```
POST http://localhost:4000/api/sensors/upload
Body: archivo CSV
```

**¿Cómo veo datos en MySQL?**
```
mysql -h ballast.proxy.rlwy.net -P 49026 -u root -p emergentes
SELECT * FROM air_quality LIMIT 10;
```

**¿Cómo veo datos en MongoDB?**
```
node test-mongodb.js
```

**¿Cómo verifico que Kafka funciona?**
```
node test-kafka-messages.js
```

**¿Cómo compilo Java Ingestor?**
```
cd ingestor-java && mvn clean package
```

---

## ⚠️ ERRORES COMUNES

```
❌ "Connection refused on 9092"
✅ docker-compose up en infra/kafka/

❌ "Port 4000 already in use"
✅ Get-Process node | Stop-Process -Force

❌ "Cannot find jar"
✅ mvn clean package en ingestor-java/

❌ "MONGODB_URI invalid"
✅ Revisar Keys.txt o DOCUMENTACION_COMPLETA

❌ "Database doesn't exist"
✅ Backend lo crea al iniciar
```

---

## 🔐 SEGURIDAD RÁPIDA

- ✅ .env NO va a Git (.gitignore)
- ✅ Keys.txt es BACKUP local
- ✅ Variables de env en CI/CD
- ✅ No hardcodear passwords
- ✅ JWT secret en .env

---

## 📞 AYUDA RÁPIDA

```
Error de conexión → DOCUMENTACION_COMPLETA_17_11_2025.md → Troubleshooting
No sé por dónde empezar → GUIA_RAPIDA_START_HERE.md
Quiero probar todo → GUIA_PRUEBAS_PRACTICAS_17_11_2025.md
Quiero entender cambios → CAMBIOS_TECNICOS_DETALLADOS_17_11_2025.md
Necesito navegar → INDICE_DOCUMENTACION_17_11_2025.md
```

---

## ✨ CHECKLIST ANTES DE PRODUCCIÓN

- [ ] npm audit (sin vulnerabilidades críticas)
- [ ] Todos los tests pasan
- [ ] MySQL y MongoDB con backups
- [ ] Logs configurados
- [ ] CORS restringido
- [ ] JWT secret complejo
- [ ] Rate limiting activo
- [ ] Health checks OK
- [ ] Permisos correctos
- [ ] Documentación actualizada

---

## 🚀 QUICK START (1 MINUTO)

```bash
# Ya todo instalado?

# 1. Kafka
cd infra/kafka && docker-compose up -d

# 2. Backend
cd BackEnd && npm run dev

# Esperar 5 segundos...

# 3. Test (en otra terminal)
cd BackEnd && node test-mysql.js
```

**¿Ves ✅? ¡Funciona!**

---

**Imprime o guarda esta tarjeta para referencia rápida**

Última actualización: 17 de Noviembre de 2025
