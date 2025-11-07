#!/usr/bin/env bash
# init-topics.sh - Script para crear topics de Kafka de manera idempotente
# Uso: bash infra/kafka/init-topics.sh

set -e

# Array de topics a crear
# Formato: "nombre:particiones:factor-replicacion"
topics=(
  "sensores.air"
  "sensores.noise"
  "sensores.underground"
  "sensores.air.avg1m"
  "sensores.noise.avg1m"
  "sensores.underground.avg1m"
)

echo "🚀 Iniciando creación de topics en Kafka..."

# Iterar sobre cada topic
for topic in "${topics[@]}"; do
  echo "📌 Creando/verificando topic: $topic"
  
  docker exec -it kafka kafka-topics.sh \
    --create \
    --if-not-exists \
    --bootstrap-server localhost:9092 \
    --replication-factor 1 \
    --partitions 1 \
    --topic "$topic"
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Topic '$topic' listo"
  else
    echo "   ❌ Error al crear topic '$topic'"
    exit 1
  fi
done

echo ""
echo "✅ Todos los topics fueron creados/verificados exitosamente"
echo ""
echo "📋 Listado de topics existentes:"
docker exec -it kafka kafka-topics.sh \
  --list \
  --bootstrap-server localhost:9092

echo ""
echo "✨ Proceso completado"
