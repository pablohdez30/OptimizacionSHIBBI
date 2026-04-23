-- ============================================================
-- ShibbiShop Manager — Supabase Schema
-- Convertido de SQLite → PostgreSQL
-- ============================================================

-- Categorías de material (Madera, Hierro, Cristal...)
CREATE TABLE categorias_material (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    es_personalizada SMALLINT DEFAULT 0
);

-- Categorías de mueble (Mesa, Estantería, Escultura...)
CREATE TABLE categorias_mueble (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    es_personalizada SMALLINT DEFAULT 0
);

-- Clientes
CREATE TABLE clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT DEFAULT '',
    ciudad TEXT DEFAULT '',
    codigo_postal TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    nif_cif TEXT DEFAULT '',
    notas TEXT DEFAULT '',
    fecha_alta TEXT NOT NULL,
    activo SMALLINT DEFAULT 1
);

-- Proveedores
CREATE TABLE proveedores (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    direccion TEXT DEFAULT '',
    notas TEXT DEFAULT '',
    activo SMALLINT DEFAULT 1,
    fecha_alta TEXT NOT NULL
);

-- Histórico de precios de proveedor
CREATE TABLE historico_precios_proveedor (
    id BIGSERIAL PRIMARY KEY,
    proveedor_id BIGINT NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
    categoria_material_id BIGINT NOT NULL REFERENCES categorias_material(id),
    descripcion_material TEXT NOT NULL,
    precio DOUBLE PRECISION NOT NULL,
    unidad TEXT DEFAULT 'ud',
    fecha_precio TEXT NOT NULL,
    notas TEXT DEFAULT ''
);

-- Presupuestos
CREATE TABLE presupuestos (
    id BIGSERIAL PRIMARY KEY,
    numero_presupuesto TEXT NOT NULL UNIQUE,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    proyecto TEXT DEFAULT '',
    fecha TEXT NOT NULL,
    estado TEXT DEFAULT 'Borrador',
    version INTEGER DEFAULT 1,
    presupuesto_padre_id BIGINT REFERENCES presupuestos(id),
    notas_internas TEXT DEFAULT '',
    condiciones_pago TEXT DEFAULT '50% adelanto - 50% antes de la entrega del trabajo.',
    dias_validez INTEGER DEFAULT 15,
    incluye_instalacion SMALLINT DEFAULT 0,
    fecha_envio TEXT,
    fecha_aceptacion TEXT,
    fecha_entrega_estimada TEXT,
    fecha_entrega_real TEXT
);

-- Líneas de presupuesto (muebles/productos)
CREATE TABLE lineas_presupuesto (
    id BIGSERIAL PRIMARY KEY,
    presupuesto_id BIGINT NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    nombre_producto TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    cantidad INTEGER DEFAULT 1,
    precio_unitario_final DOUBLE PRECISION DEFAULT 0,
    margen_porcentaje DOUBLE PRECISION DEFAULT 100,
    orden INTEGER DEFAULT 0,
    categoria_mueble_id BIGINT REFERENCES categorias_mueble(id) ON DELETE SET NULL
);

-- Detalles de coste por línea
CREATE TABLE detalles_coste (
    id BIGSERIAL PRIMARY KEY,
    linea_presupuesto_id BIGINT NOT NULL REFERENCES lineas_presupuesto(id) ON DELETE CASCADE,
    proveedor_id BIGINT REFERENCES proveedores(id),
    categoria_material_id BIGINT REFERENCES categorias_material(id),
    descripcion TEXT DEFAULT '',
    cantidad DOUBLE PRECISION DEFAULT 1,
    precio_unitario DOUBLE PRECISION DEFAULT 0,
    precio_total DOUBLE PRECISION DEFAULT 0,
    notas TEXT DEFAULT ''
);

-- Configuración clave-valor
CREATE TABLE configuracion (
    id BIGSERIAL PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    fecha_modificacion TEXT NOT NULL
);

-- Facturas
CREATE TABLE facturas (
    id BIGSERIAL PRIMARY KEY,
    numero_factura TEXT NOT NULL UNIQUE,
    presupuesto_id BIGINT REFERENCES presupuestos(id),
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    proyecto TEXT DEFAULT '',
    fecha TEXT NOT NULL,
    notas_internas TEXT DEFAULT '',
    adelanto_descripcion TEXT DEFAULT '',
    adelanto_importe DOUBLE PRECISION DEFAULT 0
);

-- Líneas de factura
CREATE TABLE lineas_factura (
    id BIGSERIAL PRIMARY KEY,
    factura_id BIGINT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    unidades DOUBLE PRECISION DEFAULT 1,
    precio_unitario DOUBLE PRECISION DEFAULT 0,
    es_porte SMALLINT DEFAULT 0,
    orden INTEGER DEFAULT 0
);

-- Eventos del calendario
CREATE TABLE eventos_calendario (
    id BIGSERIAL PRIMARY KEY,
    fecha TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    color TEXT DEFAULT '#0077b6',
    presupuesto_id BIGINT REFERENCES presupuestos(id)
);

-- Histórico de muebles (precios y referencias pasadas)
CREATE TABLE historico_muebles (
    id BIGSERIAL PRIMARY KEY,
    linea_presupuesto_id BIGINT REFERENCES lineas_presupuesto(id) ON DELETE CASCADE,
    presupuesto_id BIGINT REFERENCES presupuestos(id) ON DELETE CASCADE,
    cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
    categoria_mueble_id BIGINT REFERENCES categorias_mueble(id) ON DELETE SET NULL,
    nombre TEXT DEFAULT '',
    descripcion TEXT DEFAULT '',
    fecha TEXT NOT NULL,
    precio_unitario DOUBLE PRECISION DEFAULT 0,
    cantidad INTEGER DEFAULT 1
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_clientes_activo ON clientes(activo);
CREATE INDEX idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX idx_proveedores_activo ON proveedores(activo);
CREATE INDEX idx_historico_proveedor_id ON historico_precios_proveedor(proveedor_id);
CREATE INDEX idx_historico_descripcion ON historico_precios_proveedor(descripcion_material);
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX idx_lineas_factura_factura ON lineas_factura(factura_id);
CREATE INDEX idx_eventos_fecha ON eventos_calendario(fecha);
CREATE INDEX idx_historico_muebles_cat ON historico_muebles(categoria_mueble_id);
CREATE INDEX idx_historico_muebles_cliente ON historico_muebles(cliente_id);
CREATE INDEX idx_historico_muebles_fecha ON historico_muebles(fecha);
CREATE INDEX idx_historico_muebles_pres ON historico_muebles(presupuesto_id);

-- ============================================================
-- Default data: categorías de material
-- ============================================================
INSERT INTO categorias_material (nombre, orden) VALUES
    ('Madera', 1), ('Hierro', 2), ('Cristal', 3),
    ('Acabados/Lacado', 4), ('Barniz', 5), ('Microcemento', 6),
    ('Guías', 7), ('Mano de Obra', 8), ('Envío/Porte', 9),
    ('Extras', 10);

-- Default data: categorías de mueble
INSERT INTO categorias_mueble (nombre, orden) VALUES
    ('Mesa', 1), ('Mueble', 2), ('Estantería', 3),
    ('Escultura', 4), ('Consola', 5), ('Cerramiento', 6),
    ('Espejo', 7), ('Otros', 8);

-- Default data: configuración
INSERT INTO configuracion (clave, valor, descripcion, fecha_modificacion) VALUES
    ('precio_hora_mano_obra', '25', 'Precio por hora de mano de obra (€)', NOW()::TEXT),
    ('margen_default', '100', 'Margen por defecto (%)', NOW()::TEXT),
    ('margen_cristal', '130', 'Margen para cristal (%)', NOW()::TEXT),
    ('iva_porcentaje', '21', 'IVA (%)', NOW()::TEXT),
    ('empresa_nombre', 'CAESPAN ARGUMENT S.L.', 'Razón social', NOW()::TEXT),
    ('empresa_direccion', 'Camino de Malatones Nº 54.', 'Dirección fiscal', NOW()::TEXT),
    ('empresa_ciudad', '28140 Fuente El Saz. Madrid', 'Ciudad', NOW()::TEXT),
    ('empresa_cif', 'B-86423472', 'CIF', NOW()::TEXT),
    ('empresa_cuenta_bancaria', 'ES09-0128-1016-8201-0001-6176', 'Cuenta bancaria', NOW()::TEXT),
    ('empresa_marca', 'ShibbiShop', 'Nombre comercial', NOW()::TEXT),
    ('empresa_google_reviews', 'https://g.page/r/CY9gUGoXXmCcEBE/review', 'Enlace de reseñas de Google', NOW()::TEXT),
    ('condiciones_pago_default', '50% adelanto - 50% antes de la entrega del trabajo.', 'Condiciones de pago', NOW()::TEXT),
    ('dias_validez_default', '15', 'Días de validez del presupuesto', NOW()::TEXT),
    ('ruta_drive', '', 'Ruta de Google Drive para auto-exportar', NOW()::TEXT),
    ('auto_exportar_drive', '0', 'Exportar automáticamente a Google Drive (0/1)', NOW()::TEXT);
