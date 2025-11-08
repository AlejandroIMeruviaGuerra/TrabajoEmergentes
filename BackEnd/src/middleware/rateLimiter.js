// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter general para todos los endpoints REST
 * Límite: 100 peticiones por 15 minutos por IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por ventana
  message: {
    ok: false,
    msg: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Incluir headers RateLimit-*
  legacyHeaders: false, // Deshabilitar headers X-RateLimit-*
  // Usar IP real si está detrás de proxy (Railway)
  skip: (req) => {
    // No aplicar rate limiting a health checks
    return req.path.startsWith('/api/health');
  }
});

/**
 * Rate limiter estricto para endpoints de escritura (POST)
 * Límite: 30 peticiones por 15 minutos por IP
 */
export const writeApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo 30 escrituras por ventana
  message: {
    ok: false,
    msg: 'Demasiadas operaciones de escritura desde esta IP, por favor intenta de nuevo más tarde',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Contar todas las peticiones, incluso las exitosas
});

/**
 * Rate limiter para autenticación
 * Límite: 5 intentos de login por 15 minutos por IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login
  message: {
    ok: false,
    msg: 'Demasiados intentos de autenticación desde esta IP, por favor intenta de nuevo más tarde',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Solo contar intentos fallidos
});
