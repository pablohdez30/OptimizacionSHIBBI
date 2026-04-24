-- ============================================================
-- ShibbiShop · Activar Row Level Security
-- Modelo: un solo equipo. Cualquier usuario autenticado ve todo.
-- Ningún usuario anónimo ve nada.
-- ============================================================

-- 1) Activar RLS en todas las tablas
ALTER TABLE clientes                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_material             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_mueble               ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_precios_proveedor     ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_presupuesto              ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_coste                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_factura                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario              ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_muebles               ENABLE ROW LEVEL SECURITY;

-- 2) Política común: "usuario autenticado → acceso total"
--    (si quieres limitar por usuario o rol, este es el sitio donde añadir filtros)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'clientes','proveedores','categorias_material','categorias_mueble',
      'historico_precios_proveedor','presupuestos','lineas_presupuesto',
      'detalles_coste','configuracion','facturas','lineas_factura',
      'eventos_calendario','historico_muebles'
    ])
  LOOP
    -- Borrar política previa si existe (permite re-ejecutar el script)
    EXECUTE format(
      'DROP POLICY IF EXISTS "authenticated_full_access" ON %I', t
    );
    EXECUTE format(
      'CREATE POLICY "authenticated_full_access" ON %I '
      || 'AS PERMISSIVE FOR ALL '
      || 'TO authenticated '
      || 'USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END$$;

-- 3) (Opcional — comprobar) Ver políticas creadas
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
