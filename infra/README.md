# 🏗️ Infraestructura del Proyecto - Sensores IoT

Este directorio contiene la configuración de infraestructura necesaria para ejecutar el proyecto.

---

## 📦 Componentes

### Kafka + Zookeeper

Sistema de mensajería distribuida para procesamiento de datos de sensores en tiempo real.

---

## 🚀 Inicio Rápido

### 1. Levantar Kafka y Zookeeper

Ejecuta el siguiente comando desde la raíz del proyecto:

```bash
docker compose up -d
```

**Qué hace:**
- Inicia contenedor de Zookeeper en puerto `2181`
- Inicia contenedor de Kafka en puerto `9092`
- Configura listeners para acceso desde Windows host
- Crea topics automáticamente (definidos en `docker-compose.yml`)

**Verificar que están corriendo:**

```bash
docker ps
```

Deberías ver los contenedores `kafka` y `zookeeper` con estado "Up".

---

### 2. Crear Topics Manualmente (Alternativa)

Si prefieres crear los topics de forma explícita o si necesitas recrearlos:

**En Git Bash / Linux:**
```bash
bash infra/kafka/init-topics.sh
```

**En PowerShell (Windows):**
```powershell
# Opción 1: Ejecutar script (requiere permisos)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\infra\kafka\init-topics.ps1

# Opción 2: Crear topics manualmente
docker exec kafka kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic sensores.air
docker exec kafka kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic sensores.noise
docker exec kafka kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic sensores.underground
docker exec kafka kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic sensores.air.avg1m
docker exec kafka kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic sensores.noise.avg1m
docker exec kafka kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic sensores.underground.avg1m
```

**Qué hace este script:**
- Crea 6 topics de forma idempotente (no falla si ya existen):
  - `sensores.air` - Datos crudos de calidad del aire
  - `sensores.noise` - Datos crudos de ruido
  - `sensores.underground` - Datos crudos subterráneos
  - `sensores.air.avg1m` - Promedios 1 minuto de aire
  - `sensores.noise.avg1m` - Promedios 1 minuto de ruido
  - `sensores.underground.avg1m` - Promedios 1 minuto subterráneo
- Lista todos los topics existentes al finalizar

---

## ✅ Verificación

### Verificar topics creados

Lista todos los topics disponibles:

```bash
docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

**Salida esperada:**
```
sensores.air
sensores.air.avg1m
sensores.noise
sensores.noise.avg1m
sensores.underground
sensores.underground.avg1m
```

### Verificar Kafka está escuchando

```bash
docker logs kafka | grep -i "started"
```

---

## 🔧 Configuración

### Topics

Cada topic está configurado con:
- **Particiones:** 1 (suficiente para desarrollo)
- **Factor de replicación:** 1 (single broker)
- **Retención:** Por defecto (7 días)

### Listeners

- **Interno (contenedores):** `PLAINTEXT://0.0.0.0:9092`
- **Externo (host Windows):** `PLAINTEXT://localhost:9092`

Esto permite que:
- ✅ Backend Node.js se conecte desde host Windows
- ✅ Aplicaciones Java se conecten desde host
- ✅ Contenedores se comuniquen entre sí

---

## 🛠️ Comandos Útiles

### Ver mensajes en un topic (consumir)

```bash
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic sensores.air \
  --from-beginning \
  --max-messages 10
```

### Producir mensaje de prueba

```bash
docker exec -it kafka kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic sensores.air
```

Luego escribe un mensaje JSON y presiona Enter:
```json
{"devEui":"test123","timestamp":"2025-11-07T10:00:00Z","co2":450}
```

### Describir un topic

```bash
docker exec -it kafka kafka-topics.sh \
  --describe \
  --topic sensores.air \
  --bootstrap-server localhost:9092
```

### Eliminar un topic

```bash
docker exec -it kafka kafka-topics.sh \
  --delete \
  --topic sensores.air \
  --bootstrap-server localhost:9092
```

---

## 🔄 Reiniciar Kafka (limpiar datos)

Si necesitas limpiar todos los datos y empezar de cero:

```bash
# Detener contenedores
docker compose down

# Eliminar volúmenes (esto borra todos los mensajes)
docker volume prune -f

# Iniciar nuevamente
docker compose up -d

# Recrear topics
bash infra/kafka/init-topics.sh
```

---

## 🐛 Troubleshooting

### Kafka no inicia

**Problema:** Error de conexión con Zookeeper

**Solución:**
```bash
# Revisar logs de Zookeeper
docker logs zookeeper

# Reiniciar servicios
docker compose restart
```

### No puedo conectarme desde Node.js

**Problema:** `ECONNREFUSED localhost:9092`

**Verificar:**
1. ¿Kafka está corriendo? → `docker ps`
2. ¿Puerto 9092 está libre? → `netstat -an | findstr 9092`
3. ¿Listeners configurados correctamente? → Ver `docker-compose.yml`

**Solución común:**
```bash
# En Windows, a veces necesitas usar host.docker.internal en lugar de localhost
# Edita tu .env del backend:
KAFKA_BROKERS=localhost:9092
```

### Topics no se crean automáticamente

**Problema:** `KAFKA_CREATE_TOPICS` no funciona

**Solución:** Usa el script manual:
```bash
bash infra/kafka/init-topics.sh
```

---

## 📚 Referencias

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [wurstmeister/kafka Docker Image](https://hub.docker.com/r/wurstmeister/kafka/)
- [Kafka Topics CLI](https://kafka.apache.org/documentation/#topicconfigs)

---

## ✨ Definition of Done

Para considerar esta tarea completa, verifica:

- [x] `docker ps` muestra kafka y zookeeper "Up"
- [x] `kafka-topics.sh --list` muestra los 6 topics
- [x] Script `init-topics.sh` es idempotente (puede correr N veces sin error)
- [x] Documentación clara en este README
- [x] Backend puede conectarse y producir/consumir mensajes

---

**Última actualización:** 7 de noviembre de 2025  
**Responsable:** Daril
