-- ============================================================
-- Poblar historico_muebles desde lineas_presupuesto existentes
-- Pégalo en Supabase SQL Editor
-- ============================================================

-- Limpiar primero (idempotente)
DELETE FROM historico_muebles;

-- Poblar con todas las líneas de presupuesto
INSERT INTO historico_muebles (
    linea_presupuesto_id,
    presupuesto_id,
    cliente_id,
    categoria_mueble_id,
    nombre,
    descripcion,
    fecha,
    precio_unitario,
    cantidad
)
SELECT
    lp.id                          AS linea_presupuesto_id,
    lp.presupuesto_id              AS presupuesto_id,
    p.cliente_id                   AS cliente_id,
    lp.categoria_mueble_id         AS categoria_mueble_id,
    COALESCE(lp.nombre_producto, '') AS nombre,
    COALESCE(lp.descripcion, '')   AS descripcion,
    p.fecha                        AS fecha,
    COALESCE(lp.precio_unitario_final, 0) AS precio_unitario,
    COALESCE(lp.cantidad, 1)       AS cantidad
FROM lineas_presupuesto lp
JOIN presupuestos p ON p.id = lp.presupuesto_id
WHERE lp.nombre_producto IS NOT NULL
  AND lp.nombre_producto != '';

-- Resetear secuencia
SELECT setval(
    pg_get_serial_sequence('historico_muebles', 'id'),
    COALESCE((SELECT MAX(id) FROM historico_muebles), 1)
);

-- Verificar
SELECT COUNT(*) AS total_historico FROM historico_muebles;
