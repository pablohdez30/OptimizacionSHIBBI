"""
Migrate data from local SQLite (shibbishop.db) to Supabase.

Usage:
    python migrate_data.py /path/to/shibbishop.db

Requirements:
    pip install supabase
"""

import sys
import sqlite3
import os

# --- Supabase config ---
SUPABASE_URL = "https://mszpsbpjmptcpawxdkxd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenBzYnBqbXB0Y3Bhd3hka3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Njk5NzUsImV4cCI6MjA5MjU0NTk3NX0.LbiuiHc5hy2u4o9TEbh09jvEP_egPCTOCkYcrpc6P7k"


def dict_from_row(cursor, row):
    return {col[0]: row[i] for i, col in enumerate(cursor.description)}


def migrate(db_path):
    if not os.path.exists(db_path):
        print(f"ERROR: {db_path} not found")
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        print("Install supabase: pip install supabase")
        sys.exit(1)

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    conn = sqlite3.connect(db_path)
    conn.row_factory = dict_from_row

    # Order matters for FK constraints
    tables = [
        ("clientes", "clientes"),
        ("proveedores", "proveedores"),
        ("categorias_material", "categorias_material"),
        ("presupuestos", "presupuestos"),
        ("lineas_presupuesto", "lineas_presupuesto"),
        ("detalles_coste", "detalles_coste"),
        ("historico_precios_proveedor", "historico_precios_proveedor"),
        ("facturas", "facturas"),
        ("lineas_factura", "lineas_factura"),
        ("eventos_calendario", "eventos_calendario"),
        ("configuracion", "configuracion"),
    ]

    for sqlite_table, supa_table in tables:
        print(f"\n--- {supa_table} ---")
        cursor = conn.cursor()

        try:
            cursor.execute(f"SELECT * FROM {sqlite_table}")
        except sqlite3.OperationalError as e:
            print(f"  SKIP (table missing): {e}")
            continue

        rows = cursor.fetchall()
        if not rows:
            print(f"  Empty, skipping")
            continue

        print(f"  {len(rows)} rows to migrate")

        # Clean None values → use defaults, and fix column names
        cleaned = []
        for row in rows:
            clean = {}
            for k, v in row.items():
                if v is None and k == "id":
                    continue
                clean[k] = v
            cleaned.append(clean)

        # Insert in batches of 50
        batch_size = 50
        for i in range(0, len(cleaned), batch_size):
            batch = cleaned[i : i + batch_size]
            try:
                sb.table(supa_table).upsert(batch, on_conflict="id").execute()
                print(f"  Inserted {i + len(batch)}/{len(cleaned)}")
            except Exception as e:
                print(f"  ERROR on batch {i}: {e}")
                # Try one by one
                for j, row in enumerate(batch):
                    try:
                        sb.table(supa_table).upsert(row, on_conflict="id").execute()
                    except Exception as e2:
                        print(f"    Row {i+j} failed: {e2}")

    # Reset sequences so new IDs don't collide
    print("\n--- Resetting sequences ---")
    for _, supa_table in tables:
        try:
            result = sb.rpc("reset_sequence", {"table_name": supa_table}).execute()
        except Exception:
            pass  # Will set up via SQL if needed

    conn.close()
    print("\n✓ Migration complete!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Default path
        db_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "shibbishop.db")
    else:
        db_path = sys.argv[1]

    print(f"Migrating from: {db_path}")
    migrate(db_path)
