from datetime import datetime


class ClienteModel:
    def __init__(self, db):
        self.db = db

    def crear(self, nombre, direccion="", ciudad="", codigo_postal="",
              telefono="", email="", nif_cif="", notas=""):
        return self.db.execute(
            """INSERT INTO clientes (nombre, direccion, ciudad, codigo_postal,
               telefono, email, nif_cif, notas, fecha_alta)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (nombre, direccion, ciudad, codigo_postal, telefono,
             email, nif_cif, notas, datetime.now().isoformat())
        ).lastrowid

    def obtener(self, cliente_id):
        return self.db.fetchone("SELECT * FROM clientes WHERE id = ?", (cliente_id,))

    def listar(self, solo_activos=True):
        query = "SELECT * FROM clientes"
        if solo_activos:
            query += " WHERE activo = 1"
        query += " ORDER BY nombre"
        return self.db.fetchall(query)

    def actualizar(self, cliente_id, **kwargs):
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [cliente_id]
        self.db.execute(f"UPDATE clientes SET {campos} WHERE id = ?", valores)

    def desactivar(self, cliente_id):
        self.db.execute("UPDATE clientes SET activo = 0 WHERE id = ?", (cliente_id,))

    def buscar(self, texto):
        like = f"%{texto}%"
        return self.db.fetchall(
            """SELECT * FROM clientes WHERE activo = 1
               AND (nombre LIKE ? OR nif_cif LIKE ? OR email LIKE ? OR telefono LIKE ?)
               ORDER BY nombre""",
            (like, like, like, like)
        )


class ProveedorModel:
    def __init__(self, db):
        self.db = db

    def crear(self, nombre, telefono="", email="", direccion="", notas=""):
        return self.db.execute(
            """INSERT INTO proveedores (nombre, telefono, email, direccion, notas, fecha_alta)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (nombre, telefono, email, direccion, notas, datetime.now().isoformat())
        ).lastrowid

    def obtener(self, proveedor_id):
        return self.db.fetchone("SELECT * FROM proveedores WHERE id = ?", (proveedor_id,))

    def listar(self, solo_activos=True):
        query = "SELECT * FROM proveedores"
        if solo_activos:
            query += " WHERE activo = 1"
        query += " ORDER BY nombre"
        return self.db.fetchall(query)

    def actualizar(self, proveedor_id, **kwargs):
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [proveedor_id]
        self.db.execute(f"UPDATE proveedores SET {campos} WHERE id = ?", valores)

    def desactivar(self, proveedor_id):
        self.db.execute("UPDATE proveedores SET activo = 0 WHERE id = ?", (proveedor_id,))

    def buscar(self, texto):
        like = f"%{texto}%"
        return self.db.fetchall(
            """SELECT * FROM proveedores WHERE activo = 1
               AND (nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)
               ORDER BY nombre""",
            (like, like, like)
        )


class CategoriaModel:
    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.fetchall("SELECT * FROM categorias_material ORDER BY orden")

    def crear(self, nombre):
        max_orden = self.db.fetchone("SELECT MAX(orden) as m FROM categorias_material")
        orden = (max_orden["m"] or 0) + 1
        return self.db.execute(
            "INSERT INTO categorias_material (nombre, orden, es_personalizada) VALUES (?, ?, 1)",
            (nombre, orden)
        ).lastrowid

    def obtener_por_nombre(self, nombre):
        return self.db.fetchone(
            "SELECT * FROM categorias_material WHERE nombre = ?", (nombre,)
        )


class HistoricoPreciosModel:
    def __init__(self, db):
        self.db = db

    def registrar_precio(self, proveedor_id, categoria_material_id,
                         descripcion_material, precio, unidad="ud", notas=""):
        return self.db.execute(
            """INSERT INTO historico_precios_proveedor
               (proveedor_id, categoria_material_id, descripcion_material,
                precio, unidad, fecha_precio, notas)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (proveedor_id, categoria_material_id, descripcion_material,
             precio, unidad, datetime.now().isoformat(), notas)
        ).lastrowid

    def obtener_ultimo_precio(self, proveedor_id, descripcion_material):
        return self.db.fetchone(
            """SELECT * FROM historico_precios_proveedor
               WHERE proveedor_id = ? AND descripcion_material = ?
               ORDER BY fecha_precio DESC LIMIT 1""",
            (proveedor_id, descripcion_material)
        )

    def historial_por_proveedor(self, proveedor_id):
        return self.db.fetchall(
            """SELECT h.*, c.nombre as categoria_nombre
               FROM historico_precios_proveedor h
               LEFT JOIN categorias_material c ON h.categoria_material_id = c.id
               WHERE h.proveedor_id = ?
               ORDER BY h.fecha_precio DESC""",
            (proveedor_id,)
        )

    def materiales_actuales_proveedor(self, proveedor_id):
        """Get latest price for each unique material from a supplier."""
        all_items = self.historial_por_proveedor(proveedor_id)
        seen = {}
        for h in all_items:
            if h["descripcion_material"] not in seen:
                seen[h["descripcion_material"]] = h
        return list(seen.values())

    def historial_por_material(self, descripcion_material):
        return self.db.fetchall(
            """SELECT h.*, p.nombre as proveedor_nombre
               FROM historico_precios_proveedor h
               JOIN proveedores p ON h.proveedor_id = p.id
               WHERE h.descripcion_material LIKE ?
               ORDER BY h.fecha_precio DESC""",
            (f"%{descripcion_material}%",)
        )


class PresupuestoModel:
    def __init__(self, db):
        self.db = db

    def _generar_numero(self):
        year = datetime.now().strftime("%y")
        ultimo = self.db.fetchone(
            "SELECT numero_presupuesto FROM presupuestos WHERE numero_presupuesto LIKE ? ORDER BY id DESC LIMIT 1",
            (f"{year}-%",)
        )
        if ultimo:
            seq = int(ultimo["numero_presupuesto"].split("-")[1]) + 1
        else:
            seq = 1
        return f"{year}-{seq:03d}"

    def crear(self, cliente_id, proyecto="", notas_internas="", condiciones_pago=None,
              dias_validez=None, incluye_instalacion=False):
        numero = self._generar_numero()
        if condiciones_pago is None:
            conf = self.db.fetchone(
                "SELECT valor FROM configuracion WHERE clave = 'condiciones_pago_default'"
            )
            condiciones_pago = conf["valor"] if conf else ""
        if dias_validez is None:
            conf = self.db.fetchone(
                "SELECT valor FROM configuracion WHERE clave = 'dias_validez_default'"
            )
            dias_validez = int(conf["valor"]) if conf else 15

        return self.db.execute(
            """INSERT INTO presupuestos (numero_presupuesto, cliente_id, proyecto, fecha, estado,
               notas_internas, condiciones_pago, dias_validez, incluye_instalacion)
               VALUES (?, ?, ?, ?, 'Borrador', ?, ?, ?, ?)""",
            (numero, cliente_id, proyecto, datetime.now().strftime("%Y-%m-%d"),
             notas_internas, condiciones_pago, dias_validez,
             1 if incluye_instalacion else 0)
        ).lastrowid

    def obtener(self, presupuesto_id):
        return self.db.fetchone(
            """SELECT p.*, c.nombre as cliente_nombre, c.nif_cif as cliente_nif,
                      c.direccion as cliente_direccion
               FROM presupuestos p
               JOIN clientes c ON p.cliente_id = c.id
               WHERE p.id = ?""",
            (presupuesto_id,)
        )

    def listar(self, estado=None, cliente_id=None):
        query = """SELECT p.*, c.nombre as cliente_nombre
                   FROM presupuestos p
                   JOIN clientes c ON p.cliente_id = c.id WHERE 1=1"""
        params = []
        if estado:
            query += " AND p.estado = ?"
            params.append(estado)
        if cliente_id:
            query += " AND p.cliente_id = ?"
            params.append(cliente_id)
        query += " ORDER BY p.fecha DESC, p.id DESC"
        return self.db.fetchall(query, params)

    def actualizar_estado(self, presupuesto_id, estado):
        campos = {"estado": estado}
        if estado == "Enviado":
            campos["fecha_envio"] = datetime.now().strftime("%Y-%m-%d")
        elif estado == "Aceptado":
            campos["fecha_aceptacion"] = datetime.now().strftime("%Y-%m-%d")
            # Auto-create calendar event
            pres = self.obtener(presupuesto_id)
            if pres:
                cal = CalendarioModel(self.db)
                titulo = f"{pres['numero_presupuesto']} - {pres['cliente_nombre']}"
                cal.crear_evento(
                    fecha=datetime.now().strftime("%Y-%m-%d"),
                    titulo=titulo,
                    descripcion=f"Presupuesto {pres['numero_presupuesto']} aceptado. Pendiente de producción.",
                    color="#2d6a4f",
                    presupuesto_id=presupuesto_id
                )
        elif estado == "Entregado":
            campos["fecha_entrega_real"] = datetime.now().strftime("%Y-%m-%d")
        sets = ", ".join(f"{k} = ?" for k in campos)
        vals = list(campos.values()) + [presupuesto_id]
        self.db.execute(f"UPDATE presupuestos SET {sets} WHERE id = ?", vals)

    def actualizar(self, presupuesto_id, **kwargs):
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [presupuesto_id]
        self.db.execute(f"UPDATE presupuestos SET {campos} WHERE id = ?", valores)

    def duplicar(self, presupuesto_id):
        original = self.obtener(presupuesto_id)
        if not original:
            return None
        nuevo_id = self.crear(
            original["cliente_id"],
            proyecto=original["proyecto"] or "",
            notas_internas=original["notas_internas"],
            condiciones_pago=original["condiciones_pago"],
            dias_validez=original["dias_validez"],
            incluye_instalacion=bool(original["incluye_instalacion"]),
        )
        # Duplicar líneas
        lineas = self.obtener_lineas(presupuesto_id)
        for linea in lineas:
            nueva_linea_id = self.agregar_linea(
                nuevo_id, linea["nombre_producto"], linea["descripcion"],
                linea["cantidad"], linea["precio_unitario_final"],
                linea["margen_porcentaje"], linea["orden"]
            )
            detalles = self.obtener_detalles_coste(linea["id"])
            for det in detalles:
                self.agregar_detalle_coste(
                    nueva_linea_id, det["proveedor_id"],
                    det["categoria_material_id"], det["descripcion"],
                    det["cantidad"], det["precio_unitario"], det["notas"]
                )
        # Link to parent
        self.db.execute(
            "UPDATE presupuestos SET presupuesto_padre_id = ? WHERE id = ?",
            (presupuesto_id, nuevo_id)
        )
        return nuevo_id

    def eliminar(self, presupuesto_id):
        # Delete child records first to avoid FK constraint errors
        lineas = self.obtener_lineas(presupuesto_id)
        for linea in lineas:
            self.db.execute("DELETE FROM detalles_coste WHERE linea_presupuesto_id = ?", (linea["id"],))
        self.db.execute("DELETE FROM lineas_presupuesto WHERE presupuesto_id = ?", (presupuesto_id,))
        # Clear parent references from other presupuestos
        self.db.execute("UPDATE presupuestos SET presupuesto_padre_id = NULL WHERE presupuesto_padre_id = ?", (presupuesto_id,))
        self.db.execute("DELETE FROM presupuestos WHERE id = ?", (presupuesto_id,))

    # --- Líneas de presupuesto ---
    def agregar_linea(self, presupuesto_id, nombre_producto, descripcion="",
                      cantidad=1, precio_unitario_final=0, margen_porcentaje=100, orden=0):
        return self.db.execute(
            """INSERT INTO lineas_presupuesto (presupuesto_id, nombre_producto,
               descripcion, cantidad, precio_unitario_final, margen_porcentaje, orden)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (presupuesto_id, nombre_producto, descripcion, cantidad,
             precio_unitario_final, margen_porcentaje, orden)
        ).lastrowid

    def obtener_lineas(self, presupuesto_id):
        return self.db.fetchall(
            "SELECT * FROM lineas_presupuesto WHERE presupuesto_id = ? ORDER BY orden",
            (presupuesto_id,)
        )

    def actualizar_linea(self, linea_id, **kwargs):
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [linea_id]
        self.db.execute(f"UPDATE lineas_presupuesto SET {campos} WHERE id = ?", valores)

    def eliminar_linea(self, linea_id):
        self.db.execute("DELETE FROM lineas_presupuesto WHERE id = ?", (linea_id,))

    # --- Detalles de coste ---
    def agregar_detalle_coste(self, linea_presupuesto_id, proveedor_id=None,
                              categoria_material_id=None, descripcion="",
                              cantidad=1, precio_unitario=0, notas=""):
        precio_total = cantidad * precio_unitario
        return self.db.execute(
            """INSERT INTO detalles_coste (linea_presupuesto_id, proveedor_id,
               categoria_material_id, descripcion, cantidad, precio_unitario,
               precio_total, notas)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (linea_presupuesto_id, proveedor_id, categoria_material_id,
             descripcion, cantidad, precio_unitario, precio_total, notas)
        ).lastrowid

    def obtener_detalles_coste(self, linea_presupuesto_id):
        return self.db.fetchall(
            """SELECT d.*, c.nombre as categoria_nombre, p.nombre as proveedor_nombre
               FROM detalles_coste d
               LEFT JOIN categorias_material c ON d.categoria_material_id = c.id
               LEFT JOIN proveedores p ON d.proveedor_id = p.id
               WHERE d.linea_presupuesto_id = ?
               ORDER BY d.id""",
            (linea_presupuesto_id,)
        )

    def actualizar_detalle_coste(self, detalle_id, **kwargs):
        if "cantidad" in kwargs and "precio_unitario" in kwargs:
            kwargs["precio_total"] = kwargs["cantidad"] * kwargs["precio_unitario"]
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [detalle_id]
        self.db.execute(f"UPDATE detalles_coste SET {campos} WHERE id = ?", valores)

    def eliminar_detalle_coste(self, detalle_id):
        self.db.execute("DELETE FROM detalles_coste WHERE id = ?", (detalle_id,))

    def calcular_coste_linea(self, linea_id):
        result = self.db.fetchone(
            "SELECT COALESCE(SUM(precio_total), 0) as total FROM detalles_coste WHERE linea_presupuesto_id = ?",
            (linea_id,)
        )
        return result["total"] if result else 0

    def calcular_total_presupuesto(self, presupuesto_id):
        lineas = self.obtener_lineas(presupuesto_id)
        total = 0
        for linea in lineas:
            total += linea["precio_unitario_final"] * linea["cantidad"]
        return total


class FacturaModel:
    def __init__(self, db):
        self.db = db

    def _generar_numero(self):
        year = datetime.now().strftime("%y")
        ultimo = self.db.fetchone(
            "SELECT numero_factura FROM facturas WHERE numero_factura LIKE ? ORDER BY id DESC LIMIT 1",
            (f"{year}-%",)
        )
        if ultimo:
            seq = int(ultimo["numero_factura"].split("-")[1]) + 1
        else:
            seq = 1
        return f"{year}-{seq:03d}"

    def crear(self, cliente_id, presupuesto_id=None, proyecto="",
              notas_internas="", adelanto_descripcion="", adelanto_importe=0):
        numero = self._generar_numero()
        return self.db.execute(
            """INSERT INTO facturas (numero_factura, presupuesto_id, cliente_id, proyecto,
               fecha, notas_internas, adelanto_descripcion, adelanto_importe)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (numero, presupuesto_id, cliente_id, proyecto,
             datetime.now().strftime("%Y-%m-%d"),
             notas_internas, adelanto_descripcion, adelanto_importe)
        ).lastrowid

    def obtener(self, factura_id):
        return self.db.fetchone(
            """SELECT f.*, c.nombre as cliente_nombre, c.nif_cif as cliente_nif,
                      c.direccion as cliente_direccion
               FROM facturas f
               JOIN clientes c ON f.cliente_id = c.id
               WHERE f.id = ?""",
            (factura_id,)
        )

    def listar(self, cliente_id=None):
        query = """SELECT f.*, c.nombre as cliente_nombre
                   FROM facturas f
                   JOIN clientes c ON f.cliente_id = c.id WHERE 1=1"""
        params = []
        if cliente_id:
            query += " AND f.cliente_id = ?"
            params.append(cliente_id)
        query += " ORDER BY f.fecha DESC, f.id DESC"
        return self.db.fetchall(query, params)

    def agregar_linea(self, factura_id, concepto, descripcion="",
                      unidades=1, precio_unitario=0, es_porte=0, orden=0):
        return self.db.execute(
            """INSERT INTO lineas_factura (factura_id, concepto, descripcion,
               unidades, precio_unitario, es_porte, orden)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (factura_id, concepto, descripcion, unidades, precio_unitario, es_porte, orden)
        ).lastrowid

    def obtener_lineas(self, factura_id):
        return self.db.fetchall(
            "SELECT * FROM lineas_factura WHERE factura_id = ? ORDER BY orden",
            (factura_id,)
        )

    def eliminar_linea(self, linea_id):
        self.db.execute("DELETE FROM lineas_factura WHERE id = ?", (linea_id,))

    def eliminar(self, factura_id):
        self.db.execute("DELETE FROM lineas_factura WHERE factura_id = ?", (factura_id,))
        self.db.execute("DELETE FROM facturas WHERE id = ?", (factura_id,))

    def actualizar(self, factura_id, **kwargs):
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [factura_id]
        self.db.execute(f"UPDATE facturas SET {campos} WHERE id = ?", valores)

    def calcular_total(self, factura_id):
        result = self.db.fetchone(
            "SELECT COALESCE(SUM(unidades * precio_unitario), 0) as total FROM lineas_factura WHERE factura_id = ?",
            (factura_id,)
        )
        return result["total"] if result else 0

    def crear_desde_presupuesto(self, presupuesto_id):
        """Create a factura from presupuesto data, extracting porte costs as separate lines."""
        from app.database.models import PresupuestoModel
        pres_model = PresupuestoModel(self.db)

        pres = pres_model.obtener(presupuesto_id)
        if not pres:
            return None

        factura_id = self.crear(
            cliente_id=pres["cliente_id"],
            presupuesto_id=presupuesto_id,
            proyecto=pres["proyecto"] or "",
        )

        lineas = pres_model.obtener_lineas(presupuesto_id)
        orden = 0
        for linea in lineas:
            detalles = pres_model.obtener_detalles_coste(linea["id"])

            # Check for porte costs in detalles
            porte_coste = 0
            for det in detalles:
                if det["categoria_nombre"] and det["categoria_nombre"] == "Envío/Porte":
                    porte_coste += det["precio_total"]

            # Main product line: precio_unitario_final minus porte cost contribution (with margin)
            precio_producto = linea["precio_unitario_final"]
            if porte_coste > 0:
                # The porte cost was included in the total cost, then margin was applied.
                # We need to subtract the porte's contribution to the final price.
                margen = linea["margen_porcentaje"]
                porte_con_margen = porte_coste * (1 + margen / 100)
                precio_producto = precio_producto - porte_con_margen

            self.agregar_linea(
                factura_id,
                concepto=linea["nombre_producto"],
                descripcion=linea["descripcion"] or "",
                unidades=linea["cantidad"],
                precio_unitario=round(precio_producto, 2),
                es_porte=0,
                orden=orden,
            )
            orden += 1

            # Add porte as separate line (raw cost, no margin)
            if porte_coste > 0:
                self.agregar_linea(
                    factura_id,
                    concepto=f"Porte - {linea['nombre_producto']}",
                    descripcion="",
                    unidades=1,
                    precio_unitario=round(porte_coste, 2),
                    es_porte=1,
                    orden=orden,
                )
                orden += 1

        return factura_id


class ConfiguracionModel:
    def __init__(self, db):
        self.db = db

    def obtener(self, clave):
        row = self.db.fetchone(
            "SELECT valor FROM configuracion WHERE clave = ?", (clave,)
        )
        return row["valor"] if row else None

    def obtener_float(self, clave, default=0.0):
        val = self.obtener(clave)
        try:
            return float(val)
        except (TypeError, ValueError):
            return default

    def establecer(self, clave, valor, descripcion=None):
        existing = self.db.fetchone(
            "SELECT id FROM configuracion WHERE clave = ?", (clave,)
        )
        now = datetime.now().isoformat()
        if existing:
            if descripcion:
                self.db.execute(
                    "UPDATE configuracion SET valor = ?, descripcion = ?, fecha_modificacion = ? WHERE clave = ?",
                    (str(valor), descripcion, now, clave)
                )
            else:
                self.db.execute(
                    "UPDATE configuracion SET valor = ?, fecha_modificacion = ? WHERE clave = ?",
                    (str(valor), now, clave)
                )
        else:
            self.db.execute(
                "INSERT INTO configuracion (clave, valor, descripcion, fecha_modificacion) VALUES (?, ?, ?, ?)",
                (clave, str(valor), descripcion or "", now)
            )

    def listar_todo(self):
        return self.db.fetchall("SELECT * FROM configuracion ORDER BY clave")


class CalendarioModel:
    def __init__(self, db):
        self.db = db

    def crear_evento(self, fecha, titulo, descripcion="", color="#0077b6", presupuesto_id=None):
        return self.db.execute(
            """INSERT INTO eventos_calendario (fecha, titulo, descripcion, color, presupuesto_id)
               VALUES (?, ?, ?, ?, ?)""",
            (fecha, titulo, descripcion, color, presupuesto_id)
        ).lastrowid

    def obtener_eventos_mes(self, year, month):
        prefix = f"{year}-{month:02d}"
        return self.db.fetchall(
            "SELECT * FROM eventos_calendario WHERE fecha LIKE ? ORDER BY fecha",
            (f"{prefix}%",)
        )

    def obtener_eventos_dia(self, fecha):
        return self.db.fetchall(
            "SELECT * FROM eventos_calendario WHERE fecha = ? ORDER BY id",
            (fecha,)
        )

    def eliminar_evento(self, evento_id):
        self.db.execute("DELETE FROM eventos_calendario WHERE id = ?", (evento_id,))

    def actualizar_evento(self, evento_id, **kwargs):
        campos = ", ".join(f"{k} = ?" for k in kwargs)
        valores = list(kwargs.values()) + [evento_id]
        self.db.execute(f"UPDATE eventos_calendario SET {campos} WHERE id = ?", valores)
