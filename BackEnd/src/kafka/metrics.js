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
}

// Exportar instancia singleton
export const consumerMetrics = new ConsumerMetrics();
