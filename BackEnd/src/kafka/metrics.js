// src/kafka/metrics.js
/**
 * Sistema de métricas y telemetría para Kafka Consumer
 */

class ConsumerMetrics {
  constructor() {
    this.metrics = {
      // Contadores por topic
      messagesProcessed: {
        'sensores.air': 0,
        'sensores.noise': 0,
        'sensores.underground': 0,
        'sensores.air.avg1m': 0,
        'sensores.noise.avg1m': 0,
        'sensores.underground.avg1m': 0
      },
      
      // Contadores de errores
      errors: {
        'sensores.air': 0,
        'sensores.noise': 0,
        'sensores.underground': 0,
        'sensores.air.avg1m': 0,
        'sensores.noise.avg1m': 0,
        'sensores.underground.avg1m': 0
      },
      
      // Timestamps
      lastMessageTime: {},
      startTime: Date.now(),
      
      // Tiempos de procesamiento (ms)
      processingTimes: [],
      maxProcessingTimeSize: 100, // Mantener últimas 100 mediciones
      
      // Estado general
      totalMessages: 0,
      totalErrors: 0
    };
  }

  /**
   * Registra un mensaje procesado exitosamente
   */
  recordMessage(topic, processingTime) {
    if (this.metrics.messagesProcessed[topic] !== undefined) {
      this.metrics.messagesProcessed[topic]++;
    }
    
    this.metrics.totalMessages++;
    this.metrics.lastMessageTime[topic] = Date.now();
    
    // Registrar tiempo de procesamiento
    if (processingTime !== undefined) {
      this.metrics.processingTimes.push(processingTime);
      
      // Mantener solo las últimas N mediciones
      if (this.metrics.processingTimes.length > this.metrics.maxProcessingTimeSize) {
        this.metrics.processingTimes.shift();
      }
    }
  }

  /**
   * Registra un error de procesamiento
   */
  recordError(topic) {
    if (this.metrics.errors[topic] !== undefined) {
      this.metrics.errors[topic]++;
    }
    
    this.metrics.totalErrors++;
  }

  /**
   * Calcula el tiempo promedio de procesamiento
   */
  getAverageProcessingTime() {
    if (this.metrics.processingTimes.length === 0) return 0;
    
    const sum = this.metrics.processingTimes.reduce((a, b) => a + b, 0);
    return (sum / this.metrics.processingTimes.length).toFixed(2);
  }

  /**
   * Calcula el uptime del consumer
   */
  getUptime() {
    return Math.floor((Date.now() - this.metrics.startTime) / 1000);
  }

  /**
   * Obtiene las métricas formateadas
   */
  getMetrics() {
    const uptime = this.getUptime();
    const avgProcessingTime = this.getAverageProcessingTime();
    
    return {
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      totalMessages: this.metrics.totalMessages,
      totalErrors: this.metrics.totalErrors,
      errorRate: this.metrics.totalMessages > 0 
        ? ((this.metrics.totalErrors / this.metrics.totalMessages) * 100).toFixed(2) + '%'
        : '0%',
      messagesPerSecond: uptime > 0 
        ? (this.metrics.totalMessages / uptime).toFixed(2)
        : 0,
      averageProcessingTime: avgProcessingTime + ' ms',
      byTopic: this.getTopicMetrics(),
      lastActivity: this.getLastActivity()
    };
  }

  /**
   * Obtiene métricas por topic
   */
  getTopicMetrics() {
    const topics = {};
    
    for (const topic in this.metrics.messagesProcessed) {
      topics[topic] = {
        processed: this.metrics.messagesProcessed[topic],
        errors: this.metrics.errors[topic],
        lastMessage: this.metrics.lastMessageTime[topic] 
          ? new Date(this.metrics.lastMessageTime[topic]).toISOString()
          : null,
        errorRate: this.metrics.messagesProcessed[topic] > 0
          ? ((this.metrics.errors[topic] / this.metrics.messagesProcessed[topic]) * 100).toFixed(2) + '%'
          : '0%'
      };
    }
    
    return topics;
  }

  /**
   * Obtiene información de la última actividad
   */
  getLastActivity() {
    const timestamps = Object.values(this.metrics.lastMessageTime);
    if (timestamps.length === 0) return null;
    
    const lastTimestamp = Math.max(...timestamps);
    const secondsAgo = Math.floor((Date.now() - lastTimestamp) / 1000);
    
    return {
      timestamp: new Date(lastTimestamp).toISOString(),
      secondsAgo,
      formatted: this.formatSecondsAgo(secondsAgo)
    };
  }

  /**
   * Formatea el uptime en formato legible
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Formatea "hace cuánto tiempo"
   */
  formatSecondsAgo(seconds) {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  /**
   * Resetea las métricas (útil para testing)
   */
  reset() {
    this.metrics.startTime = Date.now();
    this.metrics.totalMessages = 0;
    this.metrics.totalErrors = 0;
    this.metrics.processingTimes = [];
    this.metrics.lastMessageTime = {};
    
    for (const topic in this.metrics.messagesProcessed) {
      this.metrics.messagesProcessed[topic] = 0;
      this.metrics.errors[topic] = 0;
    }
  }

  /**
   * Log estructurado de métricas
   */
  logSummary() {
    const metrics = this.getMetrics();
    console.log('\n📊 Métricas del Consumer Kafka:');
    console.log(`   Uptime: ${metrics.uptimeFormatted}`);
    console.log(`   Mensajes totales: ${metrics.totalMessages}`);
    console.log(`   Errores totales: ${metrics.totalErrors} (${metrics.errorRate})`);
    console.log(`   Mensajes/segundo: ${metrics.messagesPerSecond}`);
    console.log(`   Tiempo procesamiento promedio: ${metrics.averageProcessingTime}`);
    
    if (metrics.lastActivity) {
      console.log(`   Última actividad: ${metrics.lastActivity.formatted}`);
    }
  }

  // ==================== MÉTRICAS AVANZADAS ====================

  /**
   * Inicializa estructuras para métricas avanzadas
   */
  initAdvancedMetrics() {
    // Métricas de tamaño de mensajes (bytes)
    this.metrics.messageSizes = [];
    this.metrics.maxMessageSizeBuffer = 1000; // Últimos 1000 mensajes
    this.metrics.totalBytes = 0;

    // Métricas de throughput por topic (ventana de tiempo)
    this.metrics.throughputWindow = 60; // 60 segundos
    this.metrics.messageTimestamps = {}; // timestamps por topic
    
    // Métricas de latencia (percentiles)
    this.metrics.latencyBuffer = []; // Para calcular percentiles
    this.metrics.maxLatencyBuffer = 1000;

    // Métricas de batch
    this.metrics.batchSizes = [];
    this.metrics.maxBatchBuffer = 100;
    this.metrics.totalBatches = 0;

    // Consumer lag (se actualizará externamente)
    this.metrics.consumerLag = {};
  }

  /**
   * Registra el tamaño de un mensaje procesado
   */
  recordMessageSize(sizeInBytes) {
    this.metrics.messageSizes.push(sizeInBytes);
    this.metrics.totalBytes += sizeInBytes;

    // Mantener buffer limitado
    if (this.metrics.messageSizes.length > this.metrics.maxMessageSizeBuffer) {
      const removed = this.metrics.messageSizes.shift();
      this.metrics.totalBytes -= removed;
    }
  }

  /**
   * Registra un batch procesado
   */
  recordBatch(batchSize) {
    this.metrics.batchSizes.push(batchSize);
    this.metrics.totalBatches++;

    if (this.metrics.batchSizes.length > this.metrics.maxBatchBuffer) {
      this.metrics.batchSizes.shift();
    }
  }

  /**
   * Registra latencia para histograma
   */
  recordLatency(latencyMs) {
    this.metrics.latencyBuffer.push(latencyMs);

    if (this.metrics.latencyBuffer.length > this.metrics.maxLatencyBuffer) {
      this.metrics.latencyBuffer.shift();
    }
  }

  /**
   * Registra timestamp de mensaje por topic (para throughput)
   */
  recordMessageTimestamp(topic) {
    if (!this.metrics.messageTimestamps[topic]) {
      this.metrics.messageTimestamps[topic] = [];
    }

    const now = Date.now();
    this.metrics.messageTimestamps[topic].push(now);

    // Limpiar timestamps antiguos (fuera de la ventana)
    const cutoff = now - (this.metrics.throughputWindow * 1000);
    this.metrics.messageTimestamps[topic] = this.metrics.messageTimestamps[topic]
      .filter(ts => ts > cutoff);
  }

  /**
   * Actualiza el consumer lag para un topic/partition
   */
  updateConsumerLag(topic, partition, lag) {
    const key = `${topic}-${partition}`;
    this.metrics.consumerLag[key] = {
      topic,
      partition,
      lag,
      timestamp: Date.now()
    };
  }

  /**
   * Calcula percentil de un array ordenado
   */
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Obtiene histograma de latencias (P50, P95, P99)
   */
  getLatencyHistogram() {
    if (this.metrics.latencyBuffer.length === 0) {
      return { p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = [...this.metrics.latencyBuffer].sort((a, b) => a - b);
    
    return {
      p50: this.calculatePercentile(sorted, 50),
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99),
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }

  /**
   * Obtiene throughput por topic (mensajes en última ventana de tiempo)
   */
  getThroughputByTopic() {
    const throughput = {};
    
    for (const topic in this.metrics.messageTimestamps) {
      const count = this.metrics.messageTimestamps[topic].length;
      throughput[topic] = {
        messagesInWindow: count,
        messagesPerSecond: (count / this.metrics.throughputWindow).toFixed(2),
        windowSeconds: this.metrics.throughputWindow
      };
    }
    
    return throughput;
  }

  /**
   * Obtiene estadísticas de tamaño de mensajes
   */
  getMessageSizeStats() {
    if (this.metrics.messageSizes.length === 0) {
      return {
        count: 0,
        totalBytes: 0,
        avgBytes: 0,
        minBytes: 0,
        maxBytes: 0,
        totalMB: '0.00'
      };
    }

    const sorted = [...this.metrics.messageSizes].sort((a, b) => a - b);
    const sum = this.metrics.messageSizes.reduce((a, b) => a + b, 0);

    return {
      count: this.metrics.messageSizes.length,
      totalBytes: this.metrics.totalBytes,
      avgBytes: Math.round(sum / this.metrics.messageSizes.length),
      minBytes: sorted[0],
      maxBytes: sorted[sorted.length - 1],
      totalMB: (this.metrics.totalBytes / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Obtiene estadísticas de batches
   */
  getBatchStats() {
    if (this.metrics.batchSizes.length === 0) {
      return {
        totalBatches: this.metrics.totalBatches,
        avgBatchSize: 0,
        minBatchSize: 0,
        maxBatchSize: 0
      };
    }

    const sum = this.metrics.batchSizes.reduce((a, b) => a + b, 0);
    const sorted = [...this.metrics.batchSizes].sort((a, b) => a - b);

    return {
      totalBatches: this.metrics.totalBatches,
      avgBatchSize: (sum / this.metrics.batchSizes.length).toFixed(2),
      minBatchSize: sorted[0],
      maxBatchSize: sorted[sorted.length - 1]
    };
  }

  /**
   * Obtiene consumer lag total y por topic/partition
   */
  getConsumerLag() {
    const lagByTopic = {};
    let totalLag = 0;

    for (const key in this.metrics.consumerLag) {
      const { topic, partition, lag, timestamp } = this.metrics.consumerLag[key];
      
      if (!lagByTopic[topic]) {
        lagByTopic[topic] = {
          totalLag: 0,
          partitions: {}
        };
      }

      lagByTopic[topic].partitions[partition] = {
        lag,
        lastUpdate: new Date(timestamp).toISOString()
      };
      lagByTopic[topic].totalLag += lag;
      totalLag += lag;
    }

    return {
      totalLag,
      byTopic: lagByTopic,
      status: totalLag === 0 ? 'up-to-date' : totalLag < 1000 ? 'healthy' : 'lagging'
    };
  }

  /**
   * Obtiene métricas avanzadas completas
   */
  getAdvancedMetrics() {
    return {
      latency: this.getLatencyHistogram(),
      throughput: this.getThroughputByTopic(),
      messageSize: this.getMessageSizeStats(),
      batch: this.getBatchStats(),
      consumerLag: this.getConsumerLag()
    };
  }

  /**
   * Obtiene métricas completas (básicas + avanzadas)
   */
  getAllMetrics() {
    const basic = this.getMetrics();
    const advanced = this.getAdvancedMetrics();

    return {
      ...basic,
      advanced
    };
  }
}

// Exportar instancia singleton
export const consumerMetrics = new ConsumerMetrics();

// Inicializar métricas avanzadas
consumerMetrics.initAdvancedMetrics();
