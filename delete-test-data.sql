-- Script para borrar datos de prueba
-- Ejecutar desde cualquier cliente MySQL

-- Desactivar safe mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Borrar datos de air_quality con devEui de prueba
DELETE FROM air_quality WHERE devEui LIKE 'eui-000000000000000%';

-- Borrar datos de noise con devEui de prueba  
DELETE FROM noise WHERE devEui LIKE 'eui-000000000000000%';

-- Borrar datos de underground con devEui de prueba
DELETE FROM underground WHERE devEui LIKE 'eui-000000000000000%';

-- Reactivar safe mode
SET SQL_SAFE_UPDATES = 1;

-- Verificar cuántos registros quedan
SELECT 'air_quality' as tabla, COUNT(*) as registros FROM air_quality
UNION ALL
SELECT 'noise' as tabla, COUNT(*) as registros FROM noise
UNION ALL
SELECT 'underground' as tabla, COUNT(*) as registros FROM underground;
