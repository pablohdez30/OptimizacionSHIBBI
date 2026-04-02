import customtkinter as ctk
from tkinter import messagebox, filedialog


class ConfiguracionView(ctk.CTkFrame):
    """Settings view for fixed prices and company data."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._build_ui()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        ctk.CTkLabel(header, text="Configuración",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        # Content
        scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        scroll.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)
        scroll.grid_columnconfigure(0, weight=1)
        scroll.grid_columnconfigure(1, weight=1)

        # Precios fijos
        precios_card = self._card(scroll, "Precios y Márgenes", 0, 0)
        self.precio_fields = {}

        precio_items = [
            ("precio_hora_mano_obra", "Precio hora mano de obra (€)"),
            ("margen_default", "Margen por defecto (%)"),
            ("margen_cristal", "Margen cristal (%)"),
            ("iva_porcentaje", "IVA (%)"),
            ("dias_validez_default", "Días validez presupuesto"),
        ]

        for clave, label in precio_items:
            frame = ctk.CTkFrame(precios_card, fg_color="transparent")
            frame.pack(fill="x", pady=3)
            ctk.CTkLabel(frame, text=label, font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, width=250,
                         anchor="w").pack(side="left")
            entry = ctk.CTkEntry(frame, width=100, height=30)
            entry.pack(side="left", padx=10)
            val = self.app.config_model.obtener(clave) or ""
            entry.insert(0, val)
            self.precio_fields[clave] = entry

        ctk.CTkButton(precios_card, text="Guardar Precios", width=150,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_precios).pack(anchor="w", pady=(15, 5))

        # Datos empresa
        empresa_card = self._card(scroll, "Datos de la Empresa", 0, 1)
        self.empresa_fields = {}

        empresa_items = [
            ("empresa_nombre", "Razón social"),
            ("empresa_marca", "Nombre comercial"),
            ("empresa_direccion", "Dirección"),
            ("empresa_ciudad", "Ciudad / CP"),
            ("empresa_cif", "CIF"),
            ("empresa_cuenta_bancaria", "Cuenta bancaria"),
        ]

        for clave, label in empresa_items:
            frame = ctk.CTkFrame(empresa_card, fg_color="transparent")
            frame.pack(fill="x", pady=3)
            ctk.CTkLabel(frame, text=label, font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, width=180,
                         anchor="w").pack(side="left")
            entry = ctk.CTkEntry(frame, width=250, height=30)
            entry.pack(side="left", padx=10)
            val = self.app.config_model.obtener(clave) or ""
            entry.insert(0, val)
            self.empresa_fields[clave] = entry

        ctk.CTkButton(empresa_card, text="Guardar Empresa", width=150,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_empresa).pack(anchor="w", pady=(15, 5))

        # Condiciones de pago
        cond_card = self._card(scroll, "Condiciones de Pago", 1, 0)

        ctk.CTkLabel(cond_card, text="Texto por defecto:",
                     font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", pady=(0, 5))
        self.condiciones_text = ctk.CTkTextbox(cond_card, height=80)
        self.condiciones_text.pack(fill="x", pady=(0, 5))
        val = self.app.config_model.obtener("condiciones_pago_default") or ""
        self.condiciones_text.insert("1.0", val)

        ctk.CTkButton(cond_card, text="Guardar Condiciones", width=150,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_condiciones).pack(anchor="w", pady=(10, 5))

        # Categorías de material
        cat_card = self._card(scroll, "Categorías de Material", 1, 1)

        categorias = self.app.categoria_model.listar()
        for cat in categorias:
            cat_row = ctk.CTkFrame(cat_card, fg_color="transparent")
            cat_row.pack(fill="x", pady=2)
            prefix = "(personalizada) " if cat["es_personalizada"] else ""
            ctk.CTkLabel(cat_row, text=f"  {prefix}{cat['nombre']}",
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT).pack(side="left")
            ctk.CTkButton(cat_row, text="x", width=22, height=22,
                          fg_color="#dc3545", hover_color="#c1121f",
                          font=ctk.CTkFont(size=10),
                          command=lambda cid=cat["id"], cn=cat["nombre"]: self._delete_categoria(cid, cn)
                          ).pack(side="right", padx=5)

        add_frame = ctk.CTkFrame(cat_card, fg_color="transparent")
        add_frame.pack(fill="x", pady=(10, 5))
        self.new_cat_entry = ctk.CTkEntry(add_frame, placeholder_text="Nueva categoría...",
                                           width=200, height=30)
        self.new_cat_entry.pack(side="left", padx=(0, 8))
        ctk.CTkButton(add_frame, text="Añadir", width=80,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._add_categoria).pack(side="left")

        # Ruta de salida
        ruta_card = self._card(scroll, "Ruta de Salida", 2, 0)

        ctk.CTkLabel(ruta_card, text="Carpeta base donde se guardan\nPresupuestos, Facturas y Desgloses:",
                     font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT_LIGHT, justify="left").pack(anchor="w", pady=(0, 5))

        ruta_frame = ctk.CTkFrame(ruta_card, fg_color="transparent")
        ruta_frame.pack(fill="x", pady=3)
        self.ruta_entry = ctk.CTkEntry(ruta_frame, width=350, height=30,
                                        placeholder_text="Dejar vacío = app/output/")
        self.ruta_entry.pack(side="left", padx=(0, 8))
        val = self.app.config_model.obtener("ruta_salida") or ""
        self.ruta_entry.insert(0, val)
        ctk.CTkButton(ruta_frame, text="Examinar", width=90, height=30,
                      fg_color="#6c757d", hover_color="#495057",
                      command=self._browse_ruta).pack(side="left")

        ctk.CTkLabel(ruta_card, text="Estructura: {ruta}/CAESPAN 2026/FACTURAS|PRESUPUESTOS|DESGLOSES/",
                     font=ctk.CTkFont(size=11),
                     text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(3, 0))

        ctk.CTkButton(ruta_card, text="Guardar Ruta", width=150,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_ruta).pack(anchor="w", pady=(10, 5))

        # Numeración
        num_card = self._card(scroll, "Numeración", 2, 1)

        ctk.CTkLabel(num_card, text="Si ya tienes facturas/presupuestos creados,\nindica el último número usado:",
                     font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT_LIGHT, justify="left").pack(anchor="w", pady=(0, 8))

        self.num_fields = {}
        for clave, label in [("ultimo_num_presupuesto", "Último Nº Presupuesto (ej: 26-015)"),
                              ("ultimo_num_factura", "Último Nº Factura (ej: 26-025)")]:
            frame = ctk.CTkFrame(num_card, fg_color="transparent")
            frame.pack(fill="x", pady=3)
            ctk.CTkLabel(frame, text=label, font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, width=280,
                         anchor="w").pack(side="left")
            entry = ctk.CTkEntry(frame, width=120, height=30,
                                  placeholder_text="26-XXX")
            entry.pack(side="left", padx=10)
            val = self.app.config_model.obtener(clave) or ""
            entry.insert(0, val)
            self.num_fields[clave] = entry

        ctk.CTkLabel(num_card, text="La app generará el siguiente número automáticamente.\nDeja vacío para empezar desde 001.",
                     font=ctk.CTkFont(size=11),
                     text_color=self.app.COLOR_TEXT_LIGHT, justify="left").pack(anchor="w", pady=(5, 0))

        ctk.CTkButton(num_card, text="Guardar Numeración", width=150,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_numeracion).pack(anchor="w", pady=(10, 5))

    def _card(self, parent, title, row, col):
        card = ctk.CTkFrame(parent, fg_color=self.app.COLOR_CARD, corner_radius=12)
        card.grid(row=row, column=col, sticky="new", padx=8, pady=8)
        ctk.CTkLabel(card, text=title,
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=20, pady=(15, 10))
        content = ctk.CTkFrame(card, fg_color="transparent")
        content.pack(fill="x", padx=20, pady=(0, 15))
        return content

    def _guardar_precios(self):
        for clave, entry in self.precio_fields.items():
            self.app.config_model.establecer(clave, entry.get().strip())
        messagebox.showinfo("Guardado", "Precios y márgenes actualizados.")

    def _guardar_empresa(self):
        for clave, entry in self.empresa_fields.items():
            self.app.config_model.establecer(clave, entry.get().strip())
        messagebox.showinfo("Guardado", "Datos de empresa actualizados.")

    def _guardar_condiciones(self):
        val = self.condiciones_text.get("1.0", "end").strip()
        self.app.config_model.establecer("condiciones_pago_default", val)
        messagebox.showinfo("Guardado", "Condiciones de pago actualizadas.")

    def _browse_ruta(self):
        path = filedialog.askdirectory(title="Seleccionar carpeta de salida")
        if path:
            self.ruta_entry.delete(0, "end")
            self.ruta_entry.insert(0, path)

    def _guardar_ruta(self):
        val = self.ruta_entry.get().strip()
        self.app.config_model.establecer("ruta_salida", val,
                                          "Ruta base para guardar documentos")
        messagebox.showinfo("Guardado", f"Ruta de salida: {val or '(por defecto)'}")

    def _guardar_numeracion(self):
        for clave, entry in self.num_fields.items():
            val = entry.get().strip()
            if val:
                self.app.config_model.establecer(clave, val)
        messagebox.showinfo("Guardado", "Numeración actualizada. El siguiente documento usará el número siguiente.")

    def _delete_categoria(self, cat_id, cat_name):
        if messagebox.askyesno("Confirmar", f"¿Eliminar la categoría '{cat_name}'?"):
            try:
                self.app.db.execute("DELETE FROM categorias_material WHERE id = ?", (cat_id,))
                # Invalidate DetailRow cache
                from app.ui.presupuesto_nuevo import DetailRow
                DetailRow._cached_cat_names = None
                self.app._show_view("configuracion")
            except Exception as e:
                messagebox.showerror("Error", f"No se puede eliminar: {e}")

    def _add_categoria(self):
        nombre = self.new_cat_entry.get().strip()
        if not nombre:
            return
        self.app.categoria_model.crear(nombre)
        self.new_cat_entry.delete(0, "end")
        messagebox.showinfo("Añadida", f"Categoría '{nombre}' añadida.")
        # Refresh view
        self.app._show_view("configuracion")
