-- =================================================================
-- Script de Extracción y Limpieza para Machine Learning
-- Dominio: Soterrado (Underground)
-- Versión: 1.0 (con variables configurables)
-- =================================================================
--
-- Objetivo: Extraer un dataset limpio desde la tabla `underground_agg_1m`
--           para ser usado en el entrenamiento de modelos de ML.
--
USE emergentes;
-- =================================================================
-- ⚙️ Configuración de Parámetros
-- Modifica estas variables para cambiar los filtros de la consulta.
-- =================================================================
SET @start_date = '2025-10-01 00:00:00';
SET @end_date   = '2025-12-30 00:00:00';

-- Rangos para Distancia (ej. en milímetros)
SET @min_distance = 0;
SET @max_distance = 5000; -- Un valor máximo razonable, ej: 5 metros

-- =================================================================
-- Consulta Principal (No modificar)
-- =================================================================

SELECT
    distance_avg
FROM
    emergentes.underground_agg_1m
WHERE
    ts_window >= @start_date AND ts_window < @end_date
    AND distance_avg IS NOT NULL
    AND (distance_avg BETWEEN @min_distance AND @max_distance);

