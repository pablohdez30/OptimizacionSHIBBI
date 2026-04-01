from datetime import datetime
from .db_manager import get_connection


# ── Configuración ──────────────────────────────────────────

def get_config(clave):
    conn = get_connection()
    row = conn.execute("SELECT valor FROM configuracion WHERE clave = ?", (clave,)).fetchone()
    conn.close()
    return row["valor"] if row else None


def set_config(clave, valor):
    conn = get_connection()
    conn.execute(
        "UPDATE configuracion SET valor = ?, fecha_modificacion = ? WHERE clave = ?",
        (valor, datetime.now().isoformat(), clave),
    )
    conn.commit()
    conn.close()


def get_all_config():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM configuracion ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Categorías de Material ─────────────────────────────────

def get_categorias():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM categorias_material ORDER BY orden").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_categoria(nombre):
    conn = get_connection()
    max_orden = conn.execute("SELECT MAX(orden) as m FROM categorias_material").fetchone()["m"] or 0
    conn.execute(
        "INSERT INTO categorias_material (nombre, orden, es_personalizada) VALUES (?, ?, 1)",
        (nombre, max_orden + 1),
    )
    conn.commit()
    conn.close()


# ── Clientes ───────────────────────────────────────────────

def get_clientes(solo_activos=True):
    conn = get_connection()
    query = "SELECT * FROM clientes"
    if solo_activos:
        query += " WHERE activo = 1"
    query += " ORDER BY nombre"
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_cliente(cliente_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM clientes WHERE id = ?", (cliente_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def add_cliente(datos):
    conn = get_connection()
    datos["fecha_alta"] = datetime.now().isoformat()
    campos = list(datos.keys())
    valores = list(datos.values())
    placeholders = ", ".join(["?"] * len(campos))
    conn.execute(
        f"INSERT INTO clientes ({', '.join(campos)}) VALUES ({placeholders})",
        valores,
    )
    conn.commit()
    cliente_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return cliente_id


def update_cliente(cliente_id, datos):
    conn = get_connection()
    sets = ", ".join([f"{k} = ?" for k in datos.keys()])
    valores = list(datos.values()) + [cliente_id]
    conn.execute(f"UPDATE clientes SET {sets} WHERE id = ?", valores)
    conn.commit()
    conn.close()


def delete_cliente(cliente_id):
    conn = get_connection()
    conn.execute("UPDATE clientes SET activo = 0 WHERE id = ?", (cliente_id,))
    conn.commit()
    conn.close()


# ── Proveedores ────────────────────────────────────────────

def get_proveedores(solo_activos=True):
    conn = get_connection()
    query = "SELECT * FROM proveedores"
    if solo_activos:
        query += " WHERE activo = 1"
    query += " ORDER BY nombre"
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_proveedor(proveedor_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM proveedores WHERE id = ?", (proveedor_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def add_proveedor(datos):
    conn = get_connection()
    datos["fecha_alta"] = datetime.now().isoformat()
    campos = list(datos.keys())
    valores = list(datos.values())
    placeholders = ", ".join(["?"] * len(campos))
    conn.execute(
        f"INSERT INTO proveedores ({', '.join(campos)}) VALUES ({placeholders})",
        valores,
    )
    conn.commit()
    proveedor_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return proveedor_id


def update_proveedor(proveedor_id, datos):
    conn = get_connection()
    sets = ", ".join([f"{k} = ?" for k in datos.keys()])
    valores = list(datos.values()) + [proveedor_id]
    conn.execute(f"UPDATE proveedores SET {sets} WHERE id = ?", valores)
    conn.commit()
    conn.close()


def delete_proveedor(proveedor_id):
    conn = get_connection()
    conn.execute("UPDATE proveedores SET activo = 0 WHERE id = ?", (proveedor_id,))
    conn.commit()
    conn.close()


# ── Histórico Precios Proveedor ────────────────────────────

def add_precio_proveedor(proveedor_id, categoria_id, descripcion, precio, unidad="ud", notas=""):
    conn = get_connection()
    conn.execute(
        """INSERT INTO historico_precios_proveedor
           (proveedor_id, categoria_material_id, descripcion_material, precio, unidad, fecha_precio, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (proveedor_id, categoria_id, descripcion, precio, unidad, datetime.now().isoformat(), notas),
    )
    conn.commit()
    conn.close()


def get_precios_proveedor(proveedor_id):
    conn = get_connection()
    rows = conn.execute(
        """SELECT h.*, c.nombre as categoria_nombre
           FROM historico_precios_proveedor h
           LEFT JOIN categorias_material c ON h.categoria_material_id = c.id
           WHERE h.proveedor_id = ?
           ORDER BY h.fecha_precio DESC""",
        (proveedor_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_ultimo_precio(proveedor_id, descripcion_material):
    conn = get_connection()
    row = conn.execute(
        """SELECT precio FROM historico_precios_proveedor
           WHERE proveedor_id = ? AND descripcion_material = ?
           ORDER BY fecha_precio DESC LIMIT 1""",
        (proveedor_id, descripcion_material),
    ).fetchone()
    conn.close()
    return row["precio"] if row else None


# ── Presupuestos ───────────────────────────────────────────

def get_siguiente_numero_presupuesto():
    conn = get_connection()
    prefijo = conn.execute("SELECT valor FROM configuracion WHERE clave = 'prefijo_presupuesto'").fetchone()["valor"]
    ultimo = conn.execute(
        "SELECT numero_presupuesto FROM presupuestos ORDER BY id DESC LIMIT 1"
    ).fetchone()
    if ultimo:
        try:
            num = int(ultimo["numero_presupuesto"].split("-")[1]) + 1
        except (IndexError, ValueError):
            num = 1
    else:
        num = 1
    conn.close()
    return f"{prefijo}-{num:03d}"


def get_presupuestos(estado=None, cliente_id=None):
    conn = get_connection()
    query = """SELECT p.*, c.nombre as cliente_nombre
               FROM presupuestos p
               LEFT JOIN clientes c ON p.cliente_id = c.id
               WHERE 1=1"""
    params = []
    if estado:
        query += " AND p.estado = ?"
        params.append(estado)
    if cliente_id:
        query += " AND p.cliente_id = ?"
        params.append(cliente_id)
    query += " ORDER BY p.id DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_presupuesto(presupuesto_id):
    conn = get_connection()
    row = conn.execute(
        """SELECT p.*, c.nombre as cliente_nombre, c.nif_cif as cliente_nif,
                  c.direccion as cliente_direccion
           FROM presupuestos p
           LEFT JOIN clientes c ON p.cliente_id = c.id
           WHERE p.id = ?""",
        (presupuesto_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def add_presupuesto(datos):
    conn = get_connection()
    datos["fecha"] = datos.get("fecha", datetime.now().strftime("%Y-%m-%d"))
    datos["numero_presupuesto"] = datos.get("numero_presupuesto", get_siguiente_numero_presupuesto())
    campos = list(datos.keys())
    valores = list(datos.values())
    placeholders = ", ".join(["?"] * len(campos))
    conn.execute(
        f"INSERT INTO presupuestos ({', '.join(campos)}) VALUES ({placeholders})",
        valores,
    )
    conn.commit()
    presupuesto_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return presupuesto_id


def update_presupuesto(presupuesto_id, datos):
    conn = get_connection()
    sets = ", ".join([f"{k} = ?" for k in datos.keys()])
    valores = list(datos.values()) + [presupuesto_id]
    conn.execute(f"UPDATE presupuestos SET {sets} WHERE id = ?", valores)
    conn.commit()
    conn.close()


def delete_presupuesto(presupuesto_id):
    conn = get_connection()
    conn.execute("DELETE FROM presupuestos WHERE id = ?", (presupuesto_id,))
    conn.commit()
    conn.close()


def duplicar_presupuesto(presupuesto_id):
    conn = get_connection()
    original = dict(conn.execute("SELECT * FROM presupuestos WHERE id = ?", (presupuesto_id,)).fetchone())
    lineas = conn.execute("SELECT * FROM lineas_presupuesto WHERE presupuesto_id = ?", (presupuesto_id,)).fetchall()

    nuevo_numero = get_siguiente_numero_presupuesto()
    conn.execute(
        """INSERT INTO presupuestos (numero_presupuesto, cliente_id, fecha, estado, version,
           presupuesto_padre_id, notas_internas, condiciones_pago, dias_validez, incluye_instalacion)
           VALUES (?, ?, ?, 'Borrador', ?, ?, ?, ?, ?, ?)""",
        (nuevo_numero, original["cliente_id"], datetime.now().strftime("%Y-%m-%d"),
         original["version"] + 1, presupuesto_id, original["notas_internas"],
         original["condiciones_pago"], original["dias_validez"], original["incluye_instalacion"]),
    )
    nuevo_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

    for linea in lineas:
        linea = dict(linea)
        old_linea_id = linea["id"]
        conn.execute(
            """INSERT INTO lineas_presupuesto (presupuesto_id, nombre_producto, descripcion,
               cantidad, precio_unitario_final, margen_porcentaje, orden)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (nuevo_id, linea["nombre_producto"], linea["descripcion"],
             linea["cantidad"], linea["precio_unitario_final"], linea["margen_porcentaje"], linea["orden"]),
        )
        nueva_linea_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        detalles = conn.execute("SELECT * FROM detalles_coste WHERE linea_presupuesto_id = ?", (old_linea_id,)).fetchall()
        for detalle in detalles:
            detalle = dict(detalle)
            conn.execute(
                """INSERT INTO detalles_coste (linea_presupuesto_id, proveedor_id, categoria_material_id,
                   descripcion, cantidad, precio_unitario, precio_total, notas)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (nueva_linea_id, detalle["proveedor_id"], detalle["categoria_material_id"],
                 detalle["descripcion"], detalle["cantidad"], detalle["precio_unitario"],
                 detalle["precio_total"], detalle["notas"]),
            )

    conn.commit()
    conn.close()
    return nuevo_id


# ── Líneas de Presupuesto ─────────────────────────────────

def get_lineas_presupuesto(presupuesto_id):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM lineas_presupuesto WHERE presupuesto_id = ? ORDER BY orden",
        (presupuesto_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_linea_presupuesto(datos):
    conn = get_connection()
    campos = list(datos.keys())
    valores = list(datos.values())
    placeholders = ", ".join(["?"] * len(campos))
    conn.execute(
        f"INSERT INTO lineas_presupuesto ({', '.join(campos)}) VALUES ({placeholders})",
        valores,
    )
    conn.commit()
    linea_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return linea_id


def update_linea_presupuesto(linea_id, datos):
    conn = get_connection()
    sets = ", ".join([f"{k} = ?" for k in datos.keys()])
    valores = list(datos.values()) + [linea_id]
    conn.execute(f"UPDATE lineas_presupuesto SET {sets} WHERE id = ?", valores)
    conn.commit()
    conn.close()


def delete_linea_presupuesto(linea_id):
    conn = get_connection()
    conn.execute("DELETE FROM lineas_presupuesto WHERE id = ?", (linea_id,))
    conn.commit()
    conn.close()


# ── Detalles de Coste ──────────────────────────────────────

def get_detalles_coste(linea_id):
    conn = get_connection()
    rows = conn.execute(
        """SELECT d.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre
           FROM detalles_coste d
           LEFT JOIN categorias_material c ON d.categoria_material_id = c.id
           LEFT JOIN proveedores p ON d.proveedor_id = p.id
           WHERE d.linea_presupuesto_id = ?""",
        (linea_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_detalle_coste(datos):
    conn = get_connection()
    datos["precio_total"] = datos.get("cantidad", 1) * datos.get("precio_unitario", 0)
    campos = list(datos.keys())
    valores = list(datos.values())
    placeholders = ", ".join(["?"] * len(campos))
    conn.execute(
        f"INSERT INTO detalles_coste ({', '.join(campos)}) VALUES ({placeholders})",
        valores,
    )
    conn.commit()
    detalle_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return detalle_id


def update_detalle_coste(detalle_id, datos):
    conn = get_connection()
    if "cantidad" in datos and "precio_unitario" in datos:
        datos["precio_total"] = datos["cantidad"] * datos["precio_unitario"]
    sets = ", ".join([f"{k} = ?" for k in datos.keys()])
    valores = list(datos.values()) + [detalle_id]
    conn.execute(f"UPDATE detalles_coste SET {sets} WHERE id = ?", valores)
    conn.commit()
    conn.close()


def delete_detalle_coste(detalle_id):
    conn = get_connection()
    conn.execute("DELETE FROM detalles_coste WHERE id = ?", (detalle_id,))
    conn.commit()
    conn.close()


# ── Dashboard / Estadísticas ──────────────────────────────

def get_stats():
    conn = get_connection()
    stats = {}
    stats["total_clientes"] = conn.execute("SELECT COUNT(*) FROM clientes WHERE activo = 1").fetchone()[0]
    stats["total_proveedores"] = conn.execute("SELECT COUNT(*) FROM proveedores WHERE activo = 1").fetchone()[0]
    stats["presupuestos_borrador"] = conn.execute("SELECT COUNT(*) FROM presupuestos WHERE estado = 'Borrador'").fetchone()[0]
    stats["presupuestos_enviados"] = conn.execute("SELECT COUNT(*) FROM presupuestos WHERE estado = 'Enviado'").fetchone()[0]
    stats["presupuestos_aceptados"] = conn.execute("SELECT COUNT(*) FROM presupuestos WHERE estado = 'Aceptado'").fetchone()[0]
    stats["presupuestos_produccion"] = conn.execute("SELECT COUNT(*) FROM presupuestos WHERE estado = 'En producción'").fetchone()[0]

    mes_actual = datetime.now().strftime("%Y-%m")
    stats["aceptados_mes"] = conn.execute(
        "SELECT COUNT(*) FROM presupuestos WHERE estado IN ('Aceptado', 'En producción', 'Entregado') AND fecha LIKE ?",
        (f"{mes_actual}%",),
    ).fetchone()[0]

    row = conn.execute(
        """SELECT COALESCE(SUM(l.precio_unitario_final * l.cantidad), 0) as total
           FROM lineas_presupuesto l
           JOIN presupuestos p ON l.presupuesto_id = p.id
           WHERE p.estado IN ('Aceptado', 'En producción') AND p.fecha LIKE ?""",
        (f"{mes_actual}%",),
    ).fetchone()
    stats["facturacion_estimada"] = row["total"] if row else 0

    conn.close()
    return stats


# ── Búsqueda Global ───────────────────────────────────────

def buscar_global(termino):
    conn = get_connection()
    termino_like = f"%{termino}%"
    resultados = {"clientes": [], "proveedores": [], "presupuestos": []}

    resultados["clientes"] = [dict(r) for r in conn.execute(
        "SELECT * FROM clientes WHERE activo = 1 AND (nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)",
        (termino_like, termino_like, termino_like),
    ).fetchall()]

    resultados["proveedores"] = [dict(r) for r in conn.execute(
        "SELECT * FROM proveedores WHERE activo = 1 AND (nombre LIKE ? OR email LIKE ?)",
        (termino_like, termino_like),
    ).fetchall()]

    resultados["presupuestos"] = [dict(r) for r in conn.execute(
        """SELECT p.*, c.nombre as cliente_nombre FROM presupuestos p
           LEFT JOIN clientes c ON p.cliente_id = c.id
           WHERE p.numero_presupuesto LIKE ? OR c.nombre LIKE ? OR p.notas_internas LIKE ?""",
        (termino_like, termino_like, termino_like),
    ).fetchall()]

    conn.close()
    return resultados
