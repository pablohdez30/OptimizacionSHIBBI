import sqlite3
import os
from datetime import datetime


DB_DIR = os.path.join(os.path.expanduser("~"), ".shibbishop")
DB_PATH = os.path.join(DB_DIR, "shibbishop.db")


def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            direccion TEXT DEFAULT '',
            ciudad TEXT DEFAULT '',
            codigo_postal TEXT DEFAULT '',
            telefono TEXT DEFAULT '',
            email TEXT DEFAULT '',
            nif_cif TEXT DEFAULT '',
            notas TEXT DEFAULT '',
            fecha_alta TEXT NOT NULL,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS categorias_material (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            orden INTEGER DEFAULT 0,
            es_personalizada INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS proveedores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            telefono TEXT DEFAULT '',
            email TEXT DEFAULT '',
            direccion TEXT DEFAULT '',
            notas TEXT DEFAULT '',
            activo INTEGER DEFAULT 1,
            fecha_alta TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS historico_precios_proveedor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            categoria_material_id INTEGER,
            descripcion_material TEXT NOT NULL,
            precio REAL NOT NULL,
            unidad TEXT DEFAULT 'ud',
            fecha_precio TEXT NOT NULL,
            notas TEXT DEFAULT '',
            FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
            FOREIGN KEY (categoria_material_id) REFERENCES categorias_material(id)
        );

        CREATE TABLE IF NOT EXISTS presupuestos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_presupuesto TEXT NOT NULL UNIQUE,
            cliente_id INTEGER,
            fecha TEXT NOT NULL,
            estado TEXT DEFAULT 'Borrador',
            version INTEGER DEFAULT 1,
            presupuesto_padre_id INTEGER,
            notas_internas TEXT DEFAULT '',
            condiciones_pago TEXT DEFAULT '50% adelanto - 50% antes de la entrega del trabajo.',
            dias_validez INTEGER DEFAULT 15,
            incluye_instalacion INTEGER DEFAULT 0,
            fecha_envio TEXT,
            fecha_aceptacion TEXT,
            fecha_entrega_estimada TEXT,
            fecha_entrega_real TEXT,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (presupuesto_padre_id) REFERENCES presupuestos(id)
        );

        CREATE TABLE IF NOT EXISTS lineas_presupuesto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            presupuesto_id INTEGER NOT NULL,
            nombre_producto TEXT NOT NULL,
            descripcion TEXT DEFAULT '',
            cantidad INTEGER DEFAULT 1,
            precio_unitario_final REAL DEFAULT 0,
            margen_porcentaje REAL DEFAULT 100,
            orden INTEGER DEFAULT 0,
            FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS detalles_coste (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            linea_presupuesto_id INTEGER NOT NULL,
            proveedor_id INTEGER,
            categoria_material_id INTEGER,
            descripcion TEXT DEFAULT '',
            cantidad REAL DEFAULT 1,
            precio_unitario REAL DEFAULT 0,
            precio_total REAL DEFAULT 0,
            notas TEXT DEFAULT '',
            FOREIGN KEY (linea_presupuesto_id) REFERENCES lineas_presupuesto(id) ON DELETE CASCADE,
            FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
            FOREIGN KEY (categoria_material_id) REFERENCES categorias_material(id)
        );

        CREATE TABLE IF NOT EXISTS configuracion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clave TEXT NOT NULL UNIQUE,
            valor TEXT NOT NULL,
            descripcion TEXT DEFAULT '',
            fecha_modificacion TEXT NOT NULL
        );
    """)

    conn.commit()
    _insert_defaults(conn)
    conn.close()


def _insert_defaults(conn):
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    # Categorías de material por defecto
    categorias = [
        ("Madera", 1, 0),
        ("Hierro", 2, 0),
        ("Cristal", 3, 0),
        ("Acabados / Lacado", 4, 0),
        ("Barniz", 5, 0),
        ("Mano de Obra", 6, 0),
        ("Envío", 7, 0),
        ("Guías", 8, 0),
        ("Extras", 9, 0),
    ]
    for nombre, orden, es_pers in categorias:
        cursor.execute(
            "INSERT OR IGNORE INTO categorias_material (nombre, orden, es_personalizada) VALUES (?, ?, ?)",
            (nombre, orden, es_pers),
        )

    # Configuración por defecto
    configs = [
        ("empresa_nombre", "CAESPAN ARGUMENT S.L.", "Razón social de la empresa"),
        ("empresa_direccion", "Camino de Malatones Nº 54.", "Dirección de la empresa"),
        ("empresa_ciudad", "28140 Fuente El Saz. Madrid", "Ciudad y CP de la empresa"),
        ("empresa_cif", "B-86423472", "CIF de la empresa"),
        ("empresa_cuenta_bancaria", "ES09-0128-1016-8201-0001-6176", "Cuenta bancaria para pagos"),
        ("precio_hora_mano_obra", "25", "Precio por hora de mano de obra (€)"),
        ("coste_envio_base", "50", "Coste base de envío (€)"),
        ("margen_default", "100", "Margen por defecto (%) - Se aplica como x2"),
        ("margen_cristal", "30", "Margen para cristal (%) - Se aplica como x1.3 + ajuste"),
        ("iva_porcentaje", "21", "Porcentaje de IVA"),
        ("condiciones_pago", "50% adelanto - 50% antes de la entrega del trabajo.", "Condiciones de pago por defecto"),
        ("dias_validez_presupuesto", "15", "Días de validez del presupuesto"),
        ("prefijo_presupuesto", "26", "Prefijo para números de presupuesto"),
    ]
    for clave, valor, desc in configs:
        cursor.execute(
            "INSERT OR IGNORE INTO configuracion (clave, valor, descripcion, fecha_modificacion) VALUES (?, ?, ?, ?)",
            (clave, valor, desc, now),
        )

    conn.commit()
