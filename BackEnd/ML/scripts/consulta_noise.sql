-- =================================================================
-- Script de Extracción y Limpieza para Machine Learning
-- Dominio: Ruido (Noise)
-- Versión: 1.0 (con variables configurables)
-- =================================================================
--
-- Objetivo: Extraer un dataset limpio desde la tabla `noise_agg_1m`
--           para ser usado en el entrenamiento de modelos de ML.
--
USE emergentes;
-- =================================================================
-- ⚙️ Configuración de Parámetros
-- Modifica estas variables para cambiar los filtros de la consulta.
-- =================================================================
SET @start_date = '2025-10-01 00:00:00';
SET @end_date   = '2025-12-30 00:00:00';

-- Rangos para Nivel de Presión Sonora Equivalente (dBA)
SET @min_laeq = 14;
SET @max_laeq = 120;

-- Rangos para Nivel de Presión Sonora de Impulso (dBA)
SET @min_lai = 14;
SET @max_lai = 140;

-- Rangos para Nivel de Presión Sonora Máximo (dBA)
SET @min_laimax = 14;
SET @max_laimax = 140;

-- =================================================================
-- Consulta Principal (No modificar)
-- =================================================================

SELECT
    laeq_avg,
    lai_avg,
    laimax_avg
FROM
    emergentes.noise_agg_1m
WHERE
    ts_window >= @start_date AND ts_window < @end_date
    AND laeq_avg IS NOT NULL AND lai_avg IS NOT NULL AND laimax_avg IS NOT NULL
    AND (laeq_avg BETWEEN @min_laeq AND @max_laeq)
    AND (lai_avg BETWEEN @min_lai AND @max_lai)
    AND (laimax_avg BETWEEN @min_laimax AND @max_laimax);

