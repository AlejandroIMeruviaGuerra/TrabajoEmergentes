-- =================================================================
-- Script de Extracción y Limpieza para Machine Learning
-- Dominio: Calidad del Aire (Air Quality)
-- Versión: 2.0 (con variables configurables)
-- =================================================================
---
---
USE emergentes;
-- =================================================================
-- ⚙️ Configuración de Parámetros
-- Modifica estas variables para cambiar los filtros de la consulta.
-- =================================================================
SET @start_date = '2025-10-01 00:00:00';
SET @end_date   = '2025-12-30 00:00:00';

-- Rangos para CO2 (ppm)
SET @min_co2 = 300;
SET @max_co2 = 10000;

-- Rangos para Temperatura (°C)
SET @min_temp = -20;
SET @max_temp = 60;

-- Rangos para Humedad (%)
SET @min_humidity = 0;
SET @max_humidity = 100;

-- Rangos para Presión (hPa)
SET @min_pressure = 700;
SET @max_pressure = 1100;

-- =================================================================
-- Consulta Principal (No modificar)
-- Esta sección utiliza las variables definidas arriba.
-- =================================================================

SELECT
    co2_avg,
    temperature_avg,
    humidity_avg,
    pressure_avg
FROM
    emergentes.air_quality_agg_1m
WHERE
    -- 1. Filtrar por rango de fechas
    ts_window >= @start_date AND ts_window < @end_date
    -- 2. Eliminar filas con valores nulos en columnas clave
    AND co2_avg IS NOT NULL AND temperature_avg IS NOT NULL AND humidity_avg IS NOT NULL AND pressure_avg IS NOT NULL
    -- 3. Filtrar por rangos válidos usando las variables
    AND (co2_avg BETWEEN @min_co2 AND @max_co2)
    AND (temperature_avg BETWEEN @min_temp AND @max_temp)
    AND (humidity_avg BETWEEN @min_humidity AND @max_humidity)
    AND (pressure_avg BETWEEN @min_pressure AND @max_pressure);

