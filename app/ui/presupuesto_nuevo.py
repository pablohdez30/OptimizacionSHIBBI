import customtkinter as ctk
from tkinter import messagebox, ttk
import tkinter as tk
from datetime import datetime


class NuevoPresupuestoView(ctk.CTkFrame):
    """Create/edit budget with cost breakdown per furniture item."""

    def __init__(self, parent, app, presupuesto_id=None):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self.presupuesto_id = presupuesto_id
        self.mueble_frames = []
        self._build_ui()

        if presupuesto_id:
            self._cargar_presupuesto()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        title = "Editar Presupuesto" if self.presupuesto_id else "Nuevo Presupuesto"
        ctk.CTkLabel(header, text=title,
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        # Action buttons in header
        btn_frame = ctk.CTkFrame(header, fg_color="transparent")
        btn_frame.pack(side="right", padx=20)

        ctk.CTkButton(btn_frame, text="Guardar", width=100,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_con_mensaje).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="Generar Excel", width=120,
                      fg_color="#0077b6", hover_color="#005f8a",
                      command=self._generar_excel).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="Generar PDF", width=110,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._generar_pdf).pack(side="left", padx=5)

        # Scrollable content
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        self.scroll.grid_columnconfigure(0, weight=1)

        # --- Client & budget info ---
        info_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        info_card.pack(fill="x", pady=(0, 10))

        info_inner = ctk.CTkFrame(info_card, fg_color="transparent")
        info_inner.pack(fill="x", padx=20, pady=15)

        # Row 1: Client + Budget number
        row1 = ctk.CTkFrame(info_inner, fg_color="transparent")
        row1.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(row1, text="Cliente:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")

        clientes = self.app.cliente_model.listar()
        self.cliente_names = {c["nombre"]: c["id"] for c in clientes}
        client_values = list(self.cliente_names.keys()) if self.cliente_names else ["(sin clientes)"]

        self.cliente_combo = ctk.CTkComboBox(row1, values=client_values, width=250)
        self.cliente_combo.pack(side="left", padx=(10, 20))
        if client_values:
            self.cliente_combo.set(client_values[0])

        ctk.CTkButton(row1, text="+ Nuevo", width=80, height=28,
                      fg_color="#6c757d", hover_color="#495057",
                      font=ctk.CTkFont(size=12),
                      command=self._quick_new_client).pack(side="left", padx=(0, 30))

        ctk.CTkLabel(row1, text="Nº:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.numero_label = ctk.CTkLabel(row1, text="(auto)",
                                          font=ctk.CTkFont(size=13),
                                          text_color=self.app.COLOR_TEXT_LIGHT)
        self.numero_label.pack(side="left", padx=10)

        ctk.CTkLabel(row1, text="Fecha:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(20, 0))
        self.fecha_entry = ctk.CTkEntry(row1, width=110, height=30)
        self.fecha_entry.pack(side="left", padx=10)
        self.fecha_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))

        # Row 2: Proyecto + Options
        row2 = ctk.CTkFrame(info_inner, fg_color="transparent")
        row2.pack(fill="x", pady=(0, 5))

        ctk.CTkLabel(row2, text="Proyecto:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.proyecto_entry = ctk.CTkEntry(row2, width=300, height=30,
                                            placeholder_text="Ej: Reforma cocina, Salón principal...")
        self.proyecto_entry.pack(side="left", padx=(10, 20))

        ctk.CTkLabel(row2, text="Instalación:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.instalacion_var = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(row2, text="Incluida", variable=self.instalacion_var,
                        font=ctk.CTkFont(size=12)).pack(side="left", padx=10)

        # Row 3: Notas
        row3 = ctk.CTkFrame(info_inner, fg_color="transparent")
        row3.pack(fill="x")

        ctk.CTkLabel(row3, text="Notas internas:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.notas_entry = ctk.CTkEntry(row3, width=500, height=30,
                                         placeholder_text="Notas internas...")
        self.notas_entry.pack(side="left", padx=10)

        # --- Furniture items section ---
        self.muebles_container = ctk.CTkFrame(self.scroll, fg_color="transparent")
        self.muebles_container.pack(fill="x", pady=(0, 5))

        # Add furniture button
        add_btn = ctk.CTkButton(self.scroll, text="+ Añadir Mueble/Producto",
                                height=40, font=ctk.CTkFont(size=14),
                                fg_color=self.app.COLOR_ACCENT,
                                hover_color=self.app.COLOR_ACCENT_HOVER,
                                command=self._add_mueble)
        add_btn.pack(fill="x", pady=(0, 10))

        # --- Summary ---
        self.summary_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD,
                                          corner_radius=12)
        self.summary_card.pack(fill="x", pady=(0, 10))
        self._update_summary()

        # Add first furniture item
        if not self.presupuesto_id:
            self._add_mueble()

    def _add_mueble(self, data=None):
        """Add a furniture item block."""
        idx = len(self.mueble_frames)
        mueble = MuebleFrame(self.muebles_container, self.app, self, idx, data)
        mueble.pack(fill="x", pady=(0, 8))
        self.mueble_frames.append(mueble)

    def _remove_mueble(self, mueble_frame):
        if mueble_frame in self.mueble_frames:
            self.mueble_frames.remove(mueble_frame)
            mueble_frame.destroy()
            self._update_summary()

    def _update_summary(self):
        for w in self.summary_card.winfo_children():
            w.destroy()

        inner = ctk.CTkFrame(self.summary_card, fg_color="transparent")
        inner.pack(fill="x", padx=25, pady=15)

        total_base = 0
        for mf in self.mueble_frames:
            precio_cliente = mf.get_precio_cliente()
            cantidad = mf.get_cantidad()
            total_base += precio_cliente * cantidad

        iva_pct = self.app.config_model.obtener_float("iva_porcentaje", 21)
        iva = total_base * (iva_pct / 100)
        total = total_base + iva

        # Right-aligned summary
        summary = ctk.CTkFrame(inner, fg_color="transparent")
        summary.pack(side="right")

        for label, value, bold in [
            ("Base imponible:", f"{total_base:,.2f}€", False),
            (f"IVA {iva_pct:.0f}%:", f"{iva:,.2f}€", False),
            ("TOTAL:", f"{total:,.2f}€", True),
        ]:
            row = ctk.CTkFrame(summary, fg_color="transparent")
            row.pack(fill="x", pady=2)
            font = ctk.CTkFont(size=16 if bold else 14, weight="bold" if bold else "normal")
            ctk.CTkLabel(row, text=label, font=font, width=150,
                         text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
            color = self.app.COLOR_ACCENT if bold else self.app.COLOR_TEXT
            ctk.CTkLabel(row, text=value, font=font, width=120,
                         text_color=color, anchor="e").pack(side="left", padx=(10, 0))

        if not self.instalacion_var.get():
            ctk.CTkLabel(inner, text="Porte/Instalación NO incluido",
                         font=ctk.CTkFont(size=12, slant="italic"),
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(side="left")

    def _quick_new_client(self):
        dialog = ctk.CTkInputDialog(text="Nombre del cliente:", title="Nuevo Cliente")
        nombre = dialog.get_input()
        if nombre and nombre.strip():
            self.app.cliente_model.crear(nombre.strip())
            # Refresh
            clientes = self.app.cliente_model.listar()
            self.cliente_names = {c["nombre"]: c["id"] for c in clientes}
            self.cliente_combo.configure(values=list(self.cliente_names.keys()))
            self.cliente_combo.set(nombre.strip())
            # Invalidate DetailRow cache
            DetailRow._cached_cat_names = None

    def _guardar(self):
        """Save the budget. Returns the presupuesto_id or None on failure."""
        cliente_nombre = self.cliente_combo.get()
        cliente_id = self.cliente_names.get(cliente_nombre)
        if not cliente_id:
            messagebox.showwarning("Aviso", "Selecciona un cliente válido.")
            return None

        if not self.mueble_frames:
            messagebox.showwarning("Aviso", "Añade al menos un mueble/producto.")
            return None

        proyecto = self.proyecto_entry.get().strip()

        if self.presupuesto_id:
            # Update existing
            self.app.presupuesto_model.actualizar(
                self.presupuesto_id,
                cliente_id=cliente_id,
                proyecto=proyecto,
                notas_internas=self.notas_entry.get().strip(),
                incluye_instalacion=1 if self.instalacion_var.get() else 0
            )
            # Delete old lines and re-create
            old_lineas = self.app.presupuesto_model.obtener_lineas(self.presupuesto_id)
            for ol in old_lineas:
                self.app.presupuesto_model.eliminar_linea(ol["id"])

            pres_id = self.presupuesto_id
        else:
            pres_id = self.app.presupuesto_model.crear(
                cliente_id,
                proyecto=proyecto,
                notas_internas=self.notas_entry.get().strip(),
                incluye_instalacion=self.instalacion_var.get()
            )
            self.presupuesto_id = pres_id

        # Save lines
        for i, mf in enumerate(self.mueble_frames):
            coste_total = mf.get_coste_total()
            precio_cliente = mf.get_precio_cliente()

            linea_id = self.app.presupuesto_model.agregar_linea(
                pres_id,
                nombre_producto=mf.nombre_entry.get().strip() or f"Producto {i+1}",
                descripcion=mf.desc_entry.get().strip(),
                cantidad=mf.get_cantidad(),
                precio_unitario_final=precio_cliente,
                margen_porcentaje=mf.get_margen(),
                orden=i
            )

            # Save cost details
            for det in mf.get_detalles():
                cat = self.app.categoria_model.obtener_por_nombre(det["categoria"])
                cat_id = cat["id"] if cat else None

                prov_id = None
                if det["proveedor"]:
                    proveedores = self.app.proveedor_model.listar()
                    for p in proveedores:
                        if p["nombre"] == det["proveedor"]:
                            prov_id = p["id"]
                            break

                self.app.presupuesto_model.agregar_detalle_coste(
                    linea_id, prov_id, cat_id,
                    det["descripcion"], det["cantidad"],
                    det["precio_unitario"], det.get("notas", "")
                )

        # Update display
        pres = self.app.presupuesto_model.obtener(pres_id)
        if pres:
            self.numero_label.configure(text=pres["numero_presupuesto"])

        return pres_id

    def _guardar_con_mensaje(self):
        """Save and show confirmation message."""
        pres_id = self._guardar()
        if pres_id:
            messagebox.showinfo("Guardado", "Presupuesto guardado correctamente.")

    def _cargar_presupuesto(self):
        pres = self.app.presupuesto_model.obtener(self.presupuesto_id)
        if not pres:
            return

        self.numero_label.configure(text=pres["numero_presupuesto"])
        self.fecha_entry.delete(0, "end")
        try:
            fecha_obj = datetime.strptime(pres["fecha"], "%Y-%m-%d")
            self.fecha_entry.insert(0, fecha_obj.strftime("%d/%m/%Y"))
        except (ValueError, TypeError):
            self.fecha_entry.insert(0, pres["fecha"] or "")

        self.proyecto_entry.delete(0, "end")
        self.proyecto_entry.insert(0, pres["proyecto"] or "")
        self.instalacion_var.set(bool(pres["incluye_instalacion"]))
        self.notas_entry.delete(0, "end")
        self.notas_entry.insert(0, pres["notas_internas"] or "")

        # Set client
        if pres["cliente_nombre"] in self.cliente_names:
            self.cliente_combo.set(pres["cliente_nombre"])

        # Load lines
        lineas = self.app.presupuesto_model.obtener_lineas(self.presupuesto_id)
        for linea in lineas:
            detalles = self.app.presupuesto_model.obtener_detalles_coste(linea["id"])
            data = {
                "nombre": linea["nombre_producto"],
                "descripcion": linea["descripcion"],
                "cantidad": linea["cantidad"],
                "margen": linea["margen_porcentaje"],
                "detalles": [
                    {
                        "categoria": d["categoria_nombre"] or "",
                        "proveedor": d["proveedor_nombre"] or "",
                        "descripcion": d["descripcion"] or "",
                        "cantidad": d["cantidad"],
                        "precio_unitario": d["precio_unitario"],
                    }
                    for d in detalles
                ]
            }
            self._add_mueble(data)

        self._update_summary()

    def _generar_excel(self):
        # Auto-save first
        pres_id = self._guardar()
        if not pres_id:
            return
        from app.utils.excel_generator import generar_excel_presupuesto
        path = generar_excel_presupuesto(self.app, pres_id)
        if path:
            messagebox.showinfo("Excel generado", f"Archivo guardado en:\n{path}")

    def _generar_pdf(self):
        # Auto-save first
        pres_id = self._guardar()
        if not pres_id:
            return
        from app.utils.pdf_generator import generar_pdf_presupuesto
        path = generar_pdf_presupuesto(self.app, pres_id)
        if path:
            messagebox.showinfo("PDF generado", f"Archivo guardado en:\n{path}")


class MuebleFrame(ctk.CTkFrame):
    """A single furniture item with cost detail rows."""

    def __init__(self, parent, app, view, index, data=None):
        super().__init__(parent, fg_color=app.COLOR_CARD, corner_radius=12)
        self.app = app
        self.view = view
        self.index = index
        self.detail_rows = []
        self._build_ui(data)

    def _build_ui(self, data=None):
        # Header row
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=15, pady=(12, 5))

        ctk.CTkLabel(header, text="Nombre:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.nombre_entry = ctk.CTkEntry(header, width=250, height=30,
                                          placeholder_text="Ej: Mesa Piramidal Óxido")
        self.nombre_entry.pack(side="left", padx=(8, 15))

        ctk.CTkLabel(header, text="Descripción:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.desc_entry = ctk.CTkEntry(header, width=250, height=30,
                                        placeholder_text="Ej: 140*140*45Hcm, Abedul 20mm")
        self.desc_entry.pack(side="left", padx=(8, 15))

        ctk.CTkLabel(header, text="Cant:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.cant_entry = ctk.CTkEntry(header, width=50, height=30)
        self.cant_entry.pack(side="left", padx=(5, 15))
        self.cant_entry.insert(0, "1")

        ctk.CTkLabel(header, text="Margen %:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.margen_entry = ctk.CTkEntry(header, width=60, height=30)
        self.margen_entry.pack(side="left", padx=(5, 10))
        default_margen = self.app.config_model.obtener("margen_default") or "100"
        self.margen_entry.insert(0, default_margen)

        # Delete button
        ctk.CTkButton(header, text="X", width=30, height=30,
                      fg_color=self.app.COLOR_DANGER, hover_color="#c1121f",
                      command=lambda: self.view._remove_mueble(self)
                      ).pack(side="right")

        # Cost details table
        table_frame = ctk.CTkFrame(self, fg_color="transparent")
        table_frame.pack(fill="x", padx=15, pady=(5, 5))

        # Table header
        th = ctk.CTkFrame(table_frame, fg_color="#f0f2f5", corner_radius=4)
        th.pack(fill="x", pady=(0, 3))
        cols = [("Categoría", 140), ("Proveedor", 140), ("Material", 160),
                ("Cant.", 60), ("Precio Ud.", 80), ("Total", 80)]
        for text, width in cols:
            ctk.CTkLabel(th, text=text, width=width,
                         font=ctk.CTkFont(size=11, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         anchor="w").pack(side="left", padx=4, pady=5)

        self.rows_container = ctk.CTkFrame(table_frame, fg_color="transparent")
        self.rows_container.pack(fill="x")

        # Add row button
        add_row_btn = ctk.CTkButton(table_frame, text="+ Añadir línea", width=120,
                                     height=28, font=ctk.CTkFont(size=12),
                                     fg_color="#6c757d", hover_color="#495057",
                                     command=self._add_detail_row)
        add_row_btn.pack(anchor="w", pady=(5, 0))

        # Totals row
        self.totals_frame = ctk.CTkFrame(self, fg_color="#f8f9fa", corner_radius=0)
        self.totals_frame.pack(fill="x", padx=15, pady=(5, 12))

        self.coste_label = ctk.CTkLabel(self.totals_frame, text="Coste: 0,00€",
                                         font=ctk.CTkFont(size=13),
                                         text_color=self.app.COLOR_TEXT)
        self.coste_label.pack(side="left", padx=15, pady=8)

        self.precio_label = ctk.CTkLabel(self.totals_frame, text="Precio cliente: 0,00€",
                                          font=ctk.CTkFont(size=14, weight="bold"),
                                          text_color=self.app.COLOR_ACCENT)
        self.precio_label.pack(side="right", padx=15, pady=8)

        # Load data if editing
        if data:
            self.nombre_entry.insert(0, data.get("nombre", ""))
            self.desc_entry.insert(0, data.get("descripcion", ""))
            self.cant_entry.delete(0, "end")
            self.cant_entry.insert(0, str(data.get("cantidad", 1)))
            self.margen_entry.delete(0, "end")
            self.margen_entry.insert(0, str(data.get("margen", 100)))
            for det in data.get("detalles", []):
                self._add_detail_row(det)
        else:
            # Add some default rows
            self._add_detail_row({"categoria": "Madera"})
            self._add_detail_row({"categoria": "Mano de Obra"})
            self._add_detail_row({"categoria": "Extras"})

    def _add_detail_row(self, data=None):
        row = DetailRow(self.rows_container, self.app, self, data)
        row.pack(fill="x", pady=1)
        self.detail_rows.append(row)

    def _remove_detail_row(self, row):
        if row in self.detail_rows:
            self.detail_rows.remove(row)
            row.destroy()
            self._recalculate()

    def _recalculate(self):
        coste = self.get_coste_total()
        precio = self.get_precio_cliente()
        self.coste_label.configure(text=f"Coste: {coste:,.2f}€")
        self.precio_label.configure(text=f"Precio cliente: {precio:,.2f}€")
        self.view._update_summary()

    def get_coste_total(self):
        total = 0
        for row in self.detail_rows:
            total += row.get_total()
        return total

    def get_margen(self):
        try:
            return float(self.margen_entry.get().replace(",", "."))
        except ValueError:
            return 100

    def get_cantidad(self):
        try:
            return int(self.cant_entry.get())
        except ValueError:
            return 1

    def get_precio_cliente(self):
        coste = self.get_coste_total()
        margen = self.get_margen()
        return coste * (1 + margen / 100)

    def get_detalles(self):
        detalles = []
        for row in self.detail_rows:
            det = row.get_data()
            if det["precio_unitario"] > 0 or det["descripcion"]:
                detalles.append(det)
        return detalles


class DetailRow(ctk.CTkFrame):
    """A single cost detail row using lightweight ttk widgets inside CTk container."""

    # Class-level cache to avoid repeated DB queries
    _cached_cat_names = None
    _cached_prov_names = None
    _cached_prov_ids = None

    def __init__(self, parent, app, mueble, data=None):
        super().__init__(parent, fg_color="transparent", height=36)
        self.app = app
        self.mueble = mueble
        self._prov_materials = {}
        self._recalc_after_id = None

        # Cache categories and providers at class level
        if DetailRow._cached_cat_names is None:
            categorias = app.categoria_model.listar()
            DetailRow._cached_cat_names = [c["nombre"] for c in categorias]
            proveedores = app.proveedor_model.listar()
            DetailRow._cached_prov_names = ["(manual)"] + [p["nombre"] for p in proveedores]
            DetailRow._cached_prov_ids = {p["nombre"]: p["id"] for p in proveedores}

        font = ("Segoe UI", 10)

        self.cat_combo = ttk.Combobox(self, values=DetailRow._cached_cat_names,
                                       width=16, font=font)
        self.cat_combo.pack(side="left", padx=3, pady=4)

        self.prov_combo = ttk.Combobox(self, values=DetailRow._cached_prov_names,
                                        width=16, font=font)
        self.prov_combo.pack(side="left", padx=3, pady=4)
        self.prov_combo.set("(manual)")
        self.prov_combo.bind("<<ComboboxSelected>>", self._on_proveedor_change_event)

        self.desc_combo = ttk.Combobox(self, values=[], width=22, font=font)
        self.desc_combo.pack(side="left", padx=3, pady=4)
        self.desc_combo.bind("<<ComboboxSelected>>", self._on_material_select_event)

        self.cant_entry = tk.Entry(self, width=6, font=font, relief="solid", bd=1)
        self.cant_entry.pack(side="left", padx=3, pady=4)
        self.cant_entry.insert(0, "1")

        self.precio_entry = tk.Entry(self, width=9, font=font, relief="solid", bd=1)
        self.precio_entry.pack(side="left", padx=3, pady=4)
        self.precio_entry.insert(0, "0")

        self.total_label = ctk.CTkLabel(self, text="0,00€", width=80,
                                         font=ctk.CTkFont(size=12),
                                         text_color=app.COLOR_TEXT, anchor="e")
        self.total_label.pack(side="left", padx=3)

        ctk.CTkButton(self, text="x", width=26, height=26,
                      fg_color="#dc3545", hover_color="#c1121f",
                      font=ctk.CTkFont(size=11),
                      command=lambda: mueble._remove_detail_row(self)
                      ).pack(side="left", padx=3)

        # Debounced recalculation on keypress
        self.cant_entry.bind("<KeyRelease>", lambda e: self._debounce_recalc())
        self.precio_entry.bind("<KeyRelease>", lambda e: self._debounce_recalc())

        # Load data
        if data:
            if data.get("categoria"):
                self.cat_combo.set(data["categoria"])
            if data.get("proveedor"):
                self.prov_combo.set(data["proveedor"])
                self._load_proveedor_materials(data["proveedor"])
            if data.get("descripcion"):
                self.desc_combo.set(data["descripcion"])
            if data.get("cantidad"):
                self.cant_entry.delete(0, "end")
                self.cant_entry.insert(0, str(data["cantidad"]))
            if data.get("precio_unitario"):
                self.precio_entry.delete(0, "end")
                self.precio_entry.insert(0, str(data["precio_unitario"]))

        self._update_total_label()

    def _on_proveedor_change_event(self, event=None):
        prov_name = self.prov_combo.get()
        if prov_name == "(manual)" or not prov_name:
            self.desc_combo.configure(values=[])
            self.desc_combo.set("")
            return
        self._load_proveedor_materials(prov_name)

    def _load_proveedor_materials(self, prov_name):
        """Load materials from a proveedor into the description dropdown."""
        prov_id = DetailRow._cached_prov_ids.get(prov_name)
        if not prov_id:
            return

        materiales = self.app.historico_model.materiales_actuales_proveedor(prov_id)
        self._prov_materials[prov_name] = {
            m["descripcion_material"]: m for m in materiales
        }

        mat_names = [m["descripcion_material"] for m in materiales]
        self.desc_combo.configure(values=mat_names)
        if mat_names:
            self.desc_combo.set(mat_names[0])
            self._on_material_select(mat_names[0])

    def _on_material_select_event(self, event=None):
        self._on_material_select(self.desc_combo.get())

    def _on_material_select(self, material_name):
        """When a material is selected from dropdown, auto-fill the price."""
        prov_name = self.prov_combo.get()
        if prov_name in self._prov_materials:
            mat_data = self._prov_materials[prov_name].get(material_name)
            if mat_data:
                self.precio_entry.delete(0, "end")
                self.precio_entry.insert(0, str(mat_data["precio"]))
                # Also set the category (sqlite3.Row uses [] not .get())
                cat_name = mat_data["categoria_nombre"]
                if cat_name:
                    self.cat_combo.set(cat_name)
                self._debounce_recalc()

    def _debounce_recalc(self):
        if self._recalc_after_id:
            self.after_cancel(self._recalc_after_id)
        self._recalc_after_id = self.after(150, self._do_recalc)

    def _do_recalc(self):
        self._update_total_label()
        self.mueble._recalculate()

    def _update_total_label(self):
        total = self.get_total()
        self.total_label.configure(text=f"{total:,.2f}€")

    def get_total(self):
        try:
            cant = float(self.cant_entry.get().replace(",", "."))
            precio = float(self.precio_entry.get().replace(",", "."))
            return cant * precio
        except ValueError:
            return 0

    def get_data(self):
        try:
            cant = float(self.cant_entry.get().replace(",", "."))
        except ValueError:
            cant = 0
        try:
            precio = float(self.precio_entry.get().replace(",", "."))
        except ValueError:
            precio = 0
        prov = self.prov_combo.get()
        if prov == "(manual)":
            prov = ""
        return {
            "categoria": self.cat_combo.get(),
            "proveedor": prov,
            "descripcion": self.desc_combo.get().strip(),
            "cantidad": cant,
            "precio_unitario": precio,
        }
