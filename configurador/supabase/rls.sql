-- RLS — Row Level Security para el configurador.
-- Ejecutar tras schema.sql.

-- ============================================================
-- Catálogo público: cualquiera puede leer los items activos.
-- Solo service-role escribe (gestión desde Supabase Dashboard).
-- ============================================================
alter table materiales  enable row level security;
alter table componentes enable row level security;
alter table extras      enable row level security;

drop policy if exists "Materiales activos visibles" on materiales;
create policy "Materiales activos visibles"
  on materiales for select
  using (activo = true);

drop policy if exists "Componentes activos visibles" on componentes;
create policy "Componentes activos visibles"
  on componentes for select
  using (activo = true);

drop policy if exists "Extras activos visibles" on extras;
create policy "Extras activos visibles"
  on extras for select
  using (activo = true);

-- ============================================================
-- Solicitudes: solo service-role puede leer (datos sensibles).
-- La inserción se hace desde la API con service-role tras validar.
-- ============================================================
alter table solicitudes enable row level security;

-- (Sin policies de select/insert: con RLS habilitado y sin policies,
-- el rol anon NO puede leer ni escribir. Solo el service-role usado
-- desde el backend bypasea RLS.)
