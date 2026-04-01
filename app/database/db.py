import sqlite3
import os
from datetime import datetime


class Database:
    """SQLite database connection and schema management."""

    def __init__(self, db_path=None):
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, "data", "shibbishop.db")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self._create_tables()
        self._seed_defaults()

    def _create_tables(self):
        cursor = self.conn.cursor()
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
                categoria_material_id INTEGER NOT NULL,
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
                cliente_id INTEGER NOT NULL,
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
        self.conn.commit()

    def _seed_defaults(self):
        cursor = self.conn.cursor()

        # Categorías de material por defecto
        categorias = [
            ("Madera", 1), ("Hierro", 2), ("Cristal", 3),
            ("Acabados/Lacado", 4), ("Barniz", 5), ("Microcemento", 6),
            ("Guías", 7), ("Mano de Obra", 8), ("Envío/Porte", 9),
            ("Extras", 10),
        ]
        for nombre, orden in categorias:
            cursor.execute(
                "INSERT OR IGNORE INTO categorias_material (nombre, orden) VALUES (?, ?)",
                (nombre, orden)
            )

        # Configuración por defecto
        now = datetime.now().isoformat()
        defaults = [
            ("precio_hora_mano_obra", "25", "Precio por hora de mano de obra (€)"),
            ("margen_default", "100", "Margen por defecto (%)"),
            ("margen_cristal", "130", "Margen para cristal (%)"),
            ("iva_porcentaje", "21", "IVA (%)"),
            ("empresa_nombre", "CAESPAN ARGUMENT S.L.", "Razón social"),
            ("empresa_direccion", "Camino de Malatones Nº 54.", "Dirección fiscal"),
            ("empresa_ciudad", "28140 Fuente El Saz. Madrid", "Ciudad"),
            ("empresa_cif", "B-86423472", "CIF"),
            ("empresa_cuenta_bancaria", "ES09-0128-1016-8201-0001-6176", "Cuenta bancaria"),
            ("empresa_marca", "ShibbiShop", "Nombre comercial"),
            ("condiciones_pago_default", "50% adelanto - 50% antes de la entrega del trabajo.", "Condiciones de pago"),
            ("dias_validez_default", "15", "Días de validez del presupuesto"),
        ]
        for clave, valor, desc in defaults:
            cursor.execute(
                "INSERT OR IGNORE INTO configuracion (clave, valor, descripcion, fecha_modificacion) VALUES (?, ?, ?, ?)",
                (clave, valor, desc, now)
            )

        self.conn.commit()

    def execute(self, query, params=None):
        cursor = self.conn.cursor()
        cursor.execute(query, params or ())
        self.conn.commit()
        return cursor

    def fetchone(self, query, params=None):
        cursor = self.conn.cursor()
        cursor.execute(query, params or ())
        return cursor.fetchone()

    def fetchall(self, query, params=None):
        cursor = self.conn.cursor()
        cursor.execute(query, params or ())
        return cursor.fetchall()

    def close(self):
        self.conn.close()
