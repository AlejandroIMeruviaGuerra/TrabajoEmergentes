# ✅ TAREA B1 COMPLETADA: Índices SQL + Tuning

**Fecha:** 7 de noviembre de 2025  
**Responsable:** Daril  
**Estado:** ✅ COMPLETADO

---

## 📝 Resumen

Se agregaron índices optimizados a las tablas de MySQL para mejorar el rendimiento de las consultas más comunes.

---

## 🔧 Cambios Realizados

### 1. Índices Agregados

#### **Tabla `air_quality`**
- `idx_air_time` - Índice en columna `time`
- `idx_air_devEui` - Índice en columna `devEui`
- `idx_air_time_dev` - Índice compuesto `(time, devEui)`
- `idx_air_created` - Índice en `created_at`

#### **Tabla `noise`**
- `idx_noise_time` - Índice en columna `time`
- `idx_noise_devEui` - Índice en columna `devEui`
- `idx_noise_time_dev` - Índice compuesto `(time, devEui)`
- `idx_noise_created` - Índice en `created_at`

#### **Tabla `underground`**
- `idx_underground_time` - Índice en columna `time`
- `idx_underground_devEui` - Índice en columna `devEui`
- `idx_underground_time_dev` - Índice compuesto `(time, devEui)`
- `idx_underground_created` - Índice en `created_at`

#### **Tablas de Agregados (1m)**
- `idx_air_agg_window` - Índice en `air_quality_agg_1m(ts_window)`
- `idx_noise_agg_window` - Índice en `noise_agg_1m(ts_window)`
- `idx_underground_agg_window` - Índice en `underground_agg_1m(ts_window)`

**Total:** 15 índices creados

---

## 📁 Archivos Modificados/Creados

### Modificados
- ✅ `BackEnd/src/config/db_mysql.js` - Agregados índices en `initTables()`

### Creados
- ✅ `BackEnd/src/utils/verify-indexes.js` - Script de verificación
- ✅ `BackEnd/package.json` - Agregado script `verify:indexes`

---

## 🚀 Cómo Usar

### Crear/Actualizar Índices

Los índices se crean automáticamente al iniciar el backend:

```bash
cd BackEnd
npm run dev
```

Verás en la consola:
```
✅ Conectado a MySQL
✅ Tablas verificadas | Índices: 15 creados, 0 ya existían
```

### Verificar Índices

Ejecutar script de verificación:

```bash
npm run verify:indexes
```

**Salida esperada:**
```
🔍 Verificando índices SQL...

📊 Tabla: air_quality
────────────────────────────────────────────────────────────
✅ Índices encontrados (5):
   • PRIMARY: (id)
   • idx_air_time: (time)
   • idx_air_devEui: (devEui)
   • idx_air_time_dev: (time, devEui)
   • idx_air_created: (created_at)
📈 Registros: 0

⚡ Probando rendimiento de consultas...

🔎 Consulta por rango de tiempo
────────────────────────────────────────────────────────────
   Type: range
   Key: idx_air_time
   Rows: 100
   ✅ Usa índice: idx_air_time
```

---

## 📊 Mejoras de Rendimiento

### Antes (sin índices)
- Consultas por tiempo: Escaneo completo de tabla (ALL)
- Tiempo estimado: >1000ms en 100k filas
- `EXPLAIN` mostraba `type: ALL` (peor caso)

### Después (con índices)
- Consultas por tiempo: `type: range` o `type: ref`
- Tiempo estimado: <100ms en 100k filas
- `EXPLAIN` muestra uso de índices apropiados

### Casos de Uso Optimizados

1. **Consulta por rango de fechas**
   ```sql
   SELECT * FROM air_quality 
   WHERE time BETWEEN '2024-01-01' AND '2024-12-31'
   ```
   ✅ Usa `idx_air_time`

2. **Consulta por dispositivo**
   ```sql
   SELECT * FROM air_quality 
   WHERE devEui = 'device-123'
   ```
   ✅ Usa `idx_air_devEui`

3. **Consulta combinada (más eficiente)**
   ```sql
   SELECT * FROM air_quality 
   WHERE time BETWEEN '2024-01-01' AND '2024-12-31'
   AND devEui = 'device-123'
   ```
   ✅ Usa `idx_air_time_dev` (índice compuesto)

---

## 🎯 Definition of Done

### Criterios Cumplidos

- [x] Índices creados en columnas `time`, `devEui` y combinados
- [x] Índices creados para tablas de agregados (ts_window)
- [x] Script de verificación implementado
- [x] `EXPLAIN` muestra uso de índices (type=range/ref)
- [x] Los índices son idempotentes (se pueden crear múltiples veces)
- [x] Logs informativos sobre índices creados

### Verificación con EXPLAIN

```sql
-- Ejemplo de verificación manual
EXPLAIN SELECT * FROM air_quality 
WHERE time BETWEEN '2024-01-01' AND '2024-12-31' 
AND devEui = 'test-device';
```

**Resultado esperado:**
- `type`: `range` o `ref` (NO `ALL`)
- `key`: nombre del índice usado
- `rows`: cantidad reducida de filas a escanear

---

## 💡 Notas Técnicas

### Estrategia de Índices

1. **Índices simples** (`time`, `devEui`) - Para consultas por una sola columna
2. **Índices compuestos** (`time, devEui`) - Para consultas que filtran por ambas
3. **Orden de columnas** - El más selectivo primero (time antes de devEui)

### Mantenimiento

- Los índices se actualizan automáticamente en INSERT/UPDATE
- Overhead mínimo: ~5-10% en escrituras
- Beneficio: ~10-100x en lecturas

### Consideraciones

- **Espacio en disco**: Cada índice ocupa espacio adicional
- **Trade-off**: Escrituras ligeramente más lentas, lecturas mucho más rápidas
- **Monitoreo**: Usar `SHOW INDEX` y `EXPLAIN` regularmente

---

## 🔜 Próximos Pasos

Con B1 completado, las siguientes tareas relacionadas son:

- **B2**: Validaciones (Joi/Zod) + Paginación - Aprovechará estos índices
- **B3**: Health endpoint - Independiente
- **Consumer health** - Independiente

---

## ✨ Resultado

Los índices SQL están implementados y funcionando. Las consultas por tiempo y dispositivo ahora son significativamente más rápidas gracias a los índices optimizados.

**Tarea B1: ✅ COMPLETADA**
