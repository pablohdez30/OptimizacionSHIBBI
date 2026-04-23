-- Añadir columna estado a facturas
-- Ejecutar en Supabase SQL Editor
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Pendiente';

-- Marcar facturas existentes como pendientes
UPDATE facturas SET estado = 'Pendiente' WHERE estado IS NULL;
