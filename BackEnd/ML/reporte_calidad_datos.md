# Informe de Calidad de Datos - Sensores

**Fecha:** 4-12-2025
**Autor:** Alvaro Echeverría
**Datasets Generados:**

- `air_export.csv`
- `noise_export.csv`
- `underground_export.csv`

## 1. Objetivo

El propósito de este informe es documentar el proceso de extracción, limpieza y validación de los datos de los tres dominios de sensores (calidad del aire, ruido y soterrado) para su uso en modelos de Machine Learning. Se parte de las tablas agregadas por minuto (`air_quality_agg_1m`, `noise_agg_1m`, `underground_agg_1m`).

## 2. Resumen de Problemas Encontrados y Acciones Tomadas

Se aplicaron varias reglas de limpieza directamente en la consulta SQL de extracción para garantizar un dataset de alta calidad desde el origen.

**Valores Faltantes (NULLs):**
Se eliminaron todas las filas que contenían valores `NULL` en cualquiera de las columnas de métricas principales. Esto es crucial porque los valores nulos no pueden ser procesados por la mayoría de los algoritmos de Machine Learning y, en el contexto de datos agregados, su presencia indica un fallo en la captura durante esa ventana de tiempo, haciendo que la fila completa no sea confiable.

**Outliers Duros y Valores Inválidos:**
Se aplicaron filtros de rango (`BETWEEN`) directamente en la consulta SQL para descartar valores que son físicamente imposibles o muy improbables (ej. una temperatura de 200°C). Estos valores atípicos probablemente representan errores del sensor o de la transmisión y, de no ser eliminados, sesgarían negativamente el entrenamiento del modelo. Los rangos aplicados fueron:

- **Aire:** `co2_avg` (300-10000 ppm), `temperature_avg` (-20-60 °C), `humidity_avg` (0-100%), `pressure_avg` (700-1100 hPa).
- **Ruido:** `laeq_avg` (20-120 dBA), `lai_avg` (20-140 dBA), `laimax_avg` (30-140 dBA).
- **Soterrado:** `distance_avg` (0-5000 mm).

**Datos Duplicados:**
No fue necesario realizar un paso de deduplicación. La estructura de las tablas de origen (`_agg_1m`) ya garantiza la unicidad de los registros al utilizar una clave primaria compuesta por el identificador del dispositivo (`devEui`) y la ventana de tiempo (`ts_window`), previniendo duplicados a nivel de base de datos.

**Columnas Irrelevantes:**
Para simplificar los datasets de entrenamiento, se seleccionaron únicamente las columnas que contienen las métricas promedio (`_avg`) de cada dominio. Se excluyeron columnas como `devEui`, `location_name` o `count`, ya que no se consideran características (features) directas para un modelo de predicción de series temporales.

## 3. Resultado Final

Los archivos `air_export.csv`, `noise_export.csv` y `underground_export.csv` generados en la carpeta `ML/datasets/` contienen conjuntos de datos limpios, sin valores nulos ni outliers evidentes, y están listos para ser utilizados en la fase de exploración de datos (EDA) y entrenamiento de modelos.

## 4. Próximos Pasos

- Realizar un Análisis Exploratorio de Datos (EDA) sobre el CSV generado para identificar correlaciones y patrones.
- Proceder con la ingeniería de características (feature engineering) si es necesario.
- Entrenar los modelos de Machine Learning.

---

**Scripts SQL utilizados:**

- `ML/scripts/consulta_air_quality.sql`
- `ML/scripts/consulta_noise.sql`
- `ML/scripts/consulta_underground.sql`
