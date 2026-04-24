-- ============================================================
-- Porte unificado: importe a nivel de presupuesto
-- Ejecutar en Supabase → SQL Editor
-- ============================================================
--
-- Antes:
--   - Checkbox "incluye_instalacion" solo indicaba sí/no en el pie del PDF.
--   - El porte se "metía" como una línea con categoría "Envío/Porte"
--     dentro de un mueble, con lógica rara de margen.
--
-- Ahora:
--   - Un solo checkbox "Porte" en los datos generales del presupuesto.
--   - Si está marcado, aparece un input para el importe.
--   - El porte se renderiza como una línea aparte al final del PDF/Excel,
--     con concepto "Porte", sin margen.

ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS porte_importe DOUBLE PRECISION DEFAULT 0;

-- El campo `incluye_instalacion` se mantiene y ahora representa el
-- checkbox "Porte" (sí/no). No lo renombramos para no romper filas
-- existentes, pero la UI lo mostrará como "Porte".
