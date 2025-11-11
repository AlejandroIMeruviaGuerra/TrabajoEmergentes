# Ingestor Java (CSV → Kafka)

Ingesta de archivos CSV de sensores (aire, ruido, soterrado), normaliza a JSON y publica en Kafka en tres topics:

- `sensores.air`
- `sensores.noise`
- `sensores.underground`

Este módulo está preparado para: configuración externa por archivo y variables de entorno, particionamiento por `device.devEui`, reintentos/backoff, y registro de progreso por lotes.

---

## 1. Requisitos

- Java 17 o superior  
- Maven 3.8 o superior  
- Kafka en ejecución y accesible en `localhost:9092`  
  (en Windows con Docker, el broker debe anunciar `PLAINTEXT://localhost:9092`)

Opcional (para verificación manual):
- `kafka-topics.sh`
- `kafka-console-consumer.sh`

---

## 2. Estructura del proyecto

ingestor-java/
├─ src/
│ ├─ main/java/bo/univalle/gamc/ingestor/
│ │ ├─ Main.java
│ │ ├─ core/
│ │ │ ├─ CsvIngestor.java
│ │ │ ├─ Observer.java
│ │ │ ├─ Subject.java
│ │ │ └─ SensorRecord.java
│ │ ├─ normalize/
│ │ │ ├─ Normalizer.java
│ │ │ ├─ AirNormalizer.java
│ │ │ ├─ NoiseNormalizer.java
│ │ │ └─ UndergroundNormalizer.java
│ │ └─ observers/
│ │ └─ KafkaPublisherObserver.java
│ └─ main/resources/
│ └─ application.properties
├─ pom.xml
└─ README.md

yaml
Copiar código

---

## 3. Configuración

El ingestor toma configuración desde `src/main/resources/application.properties`.  
Cualquier variable puede sobreescribirse por variables de entorno (tienen prioridad).

### 3.1. `application.properties`

```properties
# ===== Kafka Producer =====
bootstrap.servers=localhost:9092
acks=all
linger.ms=25
batch.size=262144
compression.type=gzip
retries=10
retry.backoff.ms=250
request.timeout.ms=30000
enable.idempotence=true
max.in.flight.requests.per.connection=5
buffer.memory=33554432

# ===== Topics =====
topic.air=sensores.air
topic.noise=sensores.noise
topic.underground=sensores.underground

# ===== CSV (si se dejan vacíos, usar ENV) =====
csv.air=
csv.noise=
csv.und=

# ===== Progreso en logs (opcional) =====
batch.size.rows=10000
progress.every.rows=1000
Nota: compression.type=gzip es compatible con el consumidor Node (KafkaJS). Si el entorno es muy limitado, usar compression.type=none.

3.2. Variables de entorno (prioritarias)
KAFKA_BROKERS (por ejemplo, localhost:9092)

CSV_AIR (ruta absoluta al CSV de aire)

CSV_NOISE (ruta absoluta al CSV de ruido)

CSV_UND (ruta absoluta al CSV de soterrado)

Ejemplos:

Windows PowerShell

powershell
Copiar código
$env:KAFKA_BROKERS="localhost:9092"
$env:CSV_AIR="C:\datos\aire.csv"
$env:CSV_NOISE="C:\datos\ruido.csv"
$env:CSV_UND="C:\datos\soterrado.csv"
Linux/Mac (bash)

bash
Copiar código
export KAFKA_BROKERS=localhost:9092
export CSV_AIR=/data/aire.csv
export CSV_NOISE=/data/ruido.csv
export CSV_UND=/data/soterrado.csv
4. Compilación y ejecución
Desde la carpeta ingestor-java/:

bash
Copiar código
mvn -q -DskipTests package
java -jar target/ingestor-java-1.0.0-jar-with-dependencies.jar
Salida esperada (ejemplo):

makefile
Copiar código
Leyendo: aire.csv
Procesados: 10,000 registros...
Procesados: 20,000 registros...
aire.csv: 250,000 registros en 45.12 segundos
...
Ingesta finalizada
El progreso se reporta cada N filas (configurable), y al final se muestra un resumen por archivo.

5. Funcionamiento
CsvIngestor lee el CSV por filas, mapea cabeceras y construye un Map<String,String>.

El normalizador correspondiente transforma el mapa en un SensorRecord con estructura estándar.

KafkaPublisherObserver serializa el SensorRecord a JSON y publica en el topic correspondiente:

sensores.air

sensores.noise

sensores.underground

La clave del mensaje es device.devEui (si existe), lo que asegura particionamiento consistente.

6. Verificación rápida
6.1. Verificar topics
Si no se crean automáticamente, crearlos manualmente:

bash
Copiar código
kafka-topics.sh --bootstrap-server localhost:9092 --create --topic sensores.air --partitions 3 --replication-factor 1
kafka-topics.sh --bootstrap-server localhost:9092 --create --topic sensores.noise --partitions 3 --replication-factor 1
kafka-topics.sh --bootstrap-server localhost:9092 --create --topic sensores.underground --partitions 3 --replication-factor 1
6.2. Ver mensajes publicados
bash
Copiar código
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic sensores.air --from-beginning
Debe observarse JSON normalizado por cada registro del CSV.

7. Rendimiento y ajustes
Parámetros relevantes para ajustar rendimiento:

compression.type : gzip reduce ancho de banda; none reduce CPU/latencia.

linger.ms y batch.size : mayor lote mejora throughput con leve impacto en latencia.

buffer.memory : aumentar si hay muchos mensajes en vuelo.

Número de particiones del topic: más particiones permiten mayor paralelismo en los consumidores.

8. Solución de problemas
Conexión rechazada a localhost:9092: asegurar que Kafka está ejecutándose y que el broker anuncia PLAINTEXT://localhost:9092. En Docker para Windows:

ruby
Copiar código
KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
El consumer Node no soporta el códec configurado: usar compression.type=gzip o none, ambos compatibles con KafkaJS.

CSV muy grande con lectura lenta: aumentar batch.size, linger.ms y buffer.memory. Verificar que el disco no sea cuello de botella.

9. Checklist de implementación (estado actual)
 Normalizadores por dominio (aire/ruido/soterrado)

 Publicación a topics configurables

 Configuración externa por application.properties y variables de entorno

 Particionamiento por device.devEui

 Reintentos/backoff/timeout

 Contadores y logs de progreso por lote y resumen final

Estado: Completado

10. Próximo bloque: Subidas por chunks (pendiente)
Este bloque pertenece al backend Node y permitirá subir CSV grandes de forma reanudable con progreso real.

10.1. API propuesta
POST /api/uploads/init
Body:

json
Copiar código
{
  "filename": "aire.csv",
  "size": 95000000,
  "chunkSize": 5242880,
  "md5": "opcional",
  "meta": { "type": "air" }
}
Respuesta:

json
Copiar código
{ "uploadId": "uuid", "totalChunks": 19 }
POST /api/uploads/chunk
Parámetros:

uploadId

index (0..totalChunks-1)

binario del chunk (multipart/form-data o application/octet-stream)

Respuesta:

json
Copiar código
{ "ok": true, "received": 1, "next": 1 }
POST /api/uploads/complete
Body:

json
Copiar código
{ "uploadId": "uuid" }
Valida que existan todos los chunks, concatena en un archivo final, opcionalmente verifica md5, y responde:

json
Copiar código
{ "ok": true, "filePath": "/uploads/aire.csv", "meta": { "type": "air" } }
10.2. Persistencia de estado
Crear una tabla/colección uploads con:

uploadId (PK)

filename, size, chunkSize, totalChunks

receivedChunks (lista de índices recibidos)

status (init, in_progress, completed, failed)

md5 (opcional), createdAt, updatedAt

meta (JSON: tipo de sensor, usuario, etc.)

10.3. Consideraciones
Idempotencia: si se reenvía un chunk ya recibido, confirmar sin error.

Validación de index dentro de rango y de tamaño del chunk.

Reanudación: el cliente puede preguntar qué índices faltan y continuar.

Seguridad: autenticar la subida si aplica; aplicar rate limiting.

Al completar, se puede disparar el proceso de ingesta (Java) o un pipeline de ETL según sea la decisión del equipo.

11. Responsabilidades y alcance
El presente módulo cubre exclusivamente la ingesta desde CSV a Kafka. La recepción de archivos por chunks, su ensamblaje y la interfaz de usuario pertenecen al backend y frontend del proyecto y se implementarán en el siguiente bloque.