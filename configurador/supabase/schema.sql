-- Schema del configurador público de Shibbi.
-- Ejecutar en SQL Editor de Supabase tras crear el proyecto.

create extension if not exists "uuid-ossp";

-- ============================================================
-- materiales
-- ============================================================
create table if not exists materiales (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  tipo            text not null check (tipo in ('madera', 'tablero')),
  precio_m2       numeric(10, 2) not null,
  grosor_opciones text not null default '',
  foto            text,
  descripcion     text not null default '',
  aplicable_a     text[] not null default '{}',
  orden           int not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists materiales_activo_orden_idx
  on materiales (activo, orden);

-- ============================================================
-- componentes
-- ============================================================
create table if not exists componentes (
  id               uuid primary key default uuid_generate_v4(),
  nombre           text not null,
  categoria        text not null check (categoria in ('pata', 'soporte', 'marco')),
  precio_unidad    numeric(10, 2) not null,
  unidad_default   int not null default 1,
  unidad_opciones  text not null default '',
  foto             text,
  descripcion      text not null default '',
  aplicable_a      text[] not null default '{}',
  orden            int not null default 0,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists componentes_activo_orden_idx
  on componentes (activo, orden);

-- ============================================================
-- extras (acabados + servicios)
-- ============================================================
create table if not exists extras (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  categoria    text not null check (categoria in ('acabado', 'servicio')),
  precio       numeric(10, 2) not null,
  modificador  text not null check (modificador in ('fijo', 'porcentaje')),
  descripcion  text not null default '',
  aplicable_a  text[] not null default '{}',
  orden        int not null default 0,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists extras_activo_orden_idx
  on extras (activo, orden);

-- ============================================================
-- solicitudes (las que llegan del público)
-- ============================================================
create table if not exists solicitudes (
  id                    uuid primary key default uuid_generate_v4(),
  tipo                  text not null check (tipo in ('mesa', 'estanteria', 'espejo', 'otro')),

  material_id           uuid references materiales(id) on delete set null,
  material_nombre       text,
  grosor                int,

  medidas_largo         int,
  medidas_ancho         int,
  medidas_alto          int,

  componentes           jsonb not null default '[]'::jsonb,

  acabado_id            uuid references extras(id) on delete set null,
  servicios_ids         uuid[] not null default '{}',

  descripcion_libre     text,
  notas_adicionales     text,
  imagenes              text[] not null default '{}',

  nombre                text not null,
  email                 text not null,
  telefono              text,
  canal_preferido       text not null default 'email',

  presupuesto_estimado  numeric(10, 2) not null default 0,
  desglose              jsonb not null default '[]'::jsonb,

  estado                text not null default 'pendiente'
                          check (estado in ('pendiente', 'contactado', 'presupuestado', 'cerrado', 'descartado')),
  notas_internas        text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists solicitudes_estado_idx on solicitudes (estado, created_at desc);
create index if not exists solicitudes_email_idx on solicitudes (email);

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists materiales_updated_at on materiales;
create trigger materiales_updated_at before update on materiales
  for each row execute function set_updated_at();

drop trigger if exists componentes_updated_at on componentes;
create trigger componentes_updated_at before update on componentes
  for each row execute function set_updated_at();

drop trigger if exists extras_updated_at on extras;
create trigger extras_updated_at before update on extras
  for each row execute function set_updated_at();

drop trigger if exists solicitudes_updated_at on solicitudes;
create trigger solicitudes_updated_at before update on solicitudes
  for each row execute function set_updated_at();
