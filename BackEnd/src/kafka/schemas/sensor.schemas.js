// src/kafka/schemas/sensor.schemas.js
import Joi from "joi";

/**
 * Schema para datos CRUDE de sensores de calidad del aire
 * Formato: { devEui, time, temperature, humidity, co2, voc }
 */
export const airCrudeSchema = Joi.object({
  devEui: Joi.string()
    .pattern(/^eui-[0-9A-F]{16}$/i)
    .required()
    .messages({
      "string.pattern.base": "devEui debe tener formato 'eui-' seguido de 16 caracteres hexadecimales",
      "any.required": "devEui es requerido"
    }),
  
  time: Joi.date()
    .iso()
    .required()
    .messages({
      "date.format": "time debe ser una fecha ISO válida",
      "any.required": "time es requerido"
    }),
  
  temperature: Joi.number()
    .min(-50)
    .max(100)
    .required()
    .messages({
      "number.min": "temperature debe estar entre -50 y 100°C",
      "number.max": "temperature debe estar entre -50 y 100°C",
      "any.required": "temperature es requerido"
    }),
  
  humidity: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      "number.min": "humidity debe estar entre 0 y 100%",
      "number.max": "humidity debe estar entre 0 y 100%",
      "any.required": "humidity es requerido"
    }),
  
  co2: Joi.number()
    .min(0)
    .max(10000)
    .required()
    .messages({
      "number.min": "co2 debe ser >= 0 ppm",
      "number.max": "co2 debe ser <= 10000 ppm",
      "any.required": "co2 es requerido"
    }),
  
  voc: Joi.number()
    .min(0)
    .max(5000)
    .required()
    .messages({
      "number.min": "voc debe ser >= 0 ppb",
      "number.max": "voc debe ser <= 5000 ppb",
      "any.required": "voc es requerido"
    }),

  locationName: Joi.string()
    .max(100)
    .optional()
    .allow(null, "")
});

/**
 * Schema para datos CRUDE de sensores de ruido
 * Formato: { devEui, time, laeq, lai, laimax }
 */
export const noiseCrudeSchema = Joi.object({
  devEui: Joi.string()
    .pattern(/^eui-[0-9A-F]{16}$/i)
    .required()
    .messages({
      "string.pattern.base": "devEui debe tener formato 'eui-' seguido de 16 caracteres hexadecimales",
      "any.required": "devEui es requerido"
    }),
  
  time: Joi.date()
    .iso()
    .required()
    .messages({
      "date.format": "time debe ser una fecha ISO válida",
      "any.required": "time es requerido"
    }),
  
  laeq: Joi.number()
    .min(0)
    .max(140)
    .required()
    .messages({
      "number.min": "laeq debe estar entre 0 y 140 dB",
      "number.max": "laeq debe estar entre 0 y 140 dB",
      "any.required": "laeq es requerido"
    }),
  
  lai: Joi.number()
    .min(0)
    .max(140)
    .required()
    .messages({
      "number.min": "lai debe estar entre 0 y 140 dB",
      "number.max": "lai debe estar entre 0 y 140 dB",
      "any.required": "lai es requerido"
    }),
  
  laimax: Joi.number()
    .min(0)
    .max(140)
    .required()
    .messages({
      "number.min": "laimax debe estar entre 0 y 140 dB",
      "number.max": "laimax debe estar entre 0 y 140 dB",
      "any.required": "laimax es requerido"
    }),

  locationName: Joi.string()
    .max(100)
    .optional()
    .allow(null, "")
});

/**
 * Schema para datos CRUDE de sensores subterráneos
 * Formato: { devEui, time, distance }
 */
export const undergroundCrudeSchema = Joi.object({
  devEui: Joi.string()
    .pattern(/^eui-[0-9A-F]{16}$/i)
    .required()
    .messages({
      "string.pattern.base": "devEui debe tener formato 'eui-' seguido de 16 caracteres hexadecimales",
      "any.required": "devEui es requerido"
    }),
  
  time: Joi.date()
    .iso()
    .required()
    .messages({
      "date.format": "time debe ser una fecha ISO válida",
      "any.required": "time es requerido"
    }),
  
  distance: Joi.number()
    .min(0)
    .max(1000)
    .required()
    .messages({
      "number.min": "distance debe ser >= 0 cm",
      "number.max": "distance debe ser <= 1000 cm",
      "any.required": "distance es requerido"
    }),

  locationName: Joi.string()
    .max(100)
    .optional()
    .allow(null, "")
});

/**
 * Schema para datos AGREGADOS (avg1m) de calidad del aire
 * Formato: { sum_temperature, sum_humidity, sum_co2, sum_voc, count, locationName? }
 */
export const airAggregatedSchema = Joi.object({
  sum_temperature: Joi.number()
    .required()
    .messages({
      "any.required": "sum_temperature es requerido"
    }),
  
  sum_humidity: Joi.number()
    .required()
    .messages({
      "any.required": "sum_humidity es requerido"
    }),
  
  sum_co2: Joi.number()
    .required()
    .messages({
      "any.required": "sum_co2 es requerido"
    }),
  
  sum_voc: Joi.number()
    .required()
    .messages({
      "any.required": "sum_voc es requerido"
    }),
  
  count: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.min": "count debe ser >= 1",
      "any.required": "count es requerido"
    }),

  locationName: Joi.string()
    .max(100)
    .optional()
    .allow(null, "")
});

/**
 * Schema para datos AGREGADOS (avg1m) de ruido
 * Formato: { sum_laeq, sum_lai, sum_laimax, count, locationName? }
 */
export const noiseAggregatedSchema = Joi.object({
  sum_laeq: Joi.number()
    .required()
    .messages({
      "any.required": "sum_laeq es requerido"
    }),
  
  sum_lai: Joi.number()
    .required()
    .messages({
      "any.required": "sum_lai es requerido"
    }),
  
  sum_laimax: Joi.number()
    .required()
    .messages({
      "any.required": "sum_laimax es requerido"
    }),
  
  count: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.min": "count debe ser >= 1",
      "any.required": "count es requerido"
    }),

  locationName: Joi.string()
    .max(100)
    .optional()
    .allow(null, "")
});

/**
 * Schema para datos AGREGADOS (avg1m) subterráneos
 * Formato: { sum_distance, count, locationName? }
 */
export const undergroundAggregatedSchema = Joi.object({
  sum_distance: Joi.number()
    .required()
    .messages({
      "any.required": "sum_distance es requerido"
    }),
  
  count: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.min": "count debe ser >= 1",
      "any.required": "count es requerido"
    }),

  locationName: Joi.string()
    .max(100)
    .optional()
    .allow(null, "")
});

/**
 * Función helper para validar datos con un schema de Joi
 * @param {Object} data - Datos a validar
 * @param {Joi.Schema} schema - Schema de Joi
 * @returns {{ valid: boolean, errors: string[] | null, value: any }}
 */
export function validateData(data, schema) {
  const { error, value } = schema.validate(data, { 
    abortEarly: false, // Recopilar todos los errores
    stripUnknown: true  // Eliminar campos desconocidos
  });

  if (error) {
    return {
      valid: false,
      errors: error.details.map(detail => detail.message),
      value: null
    };
  }

  return {
    valid: true,
    errors: null,
    value
  };
}
