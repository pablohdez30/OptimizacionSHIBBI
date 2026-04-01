import customtkinter as ctk
from tkinter import messagebox


class ProveedoresView(ctk.CTkFrame):
    """Supplier management view with list, CRUD, and price history."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._build_ui()
        self._cargar_proveedores()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        ctk.CTkLabel(header, text="Proveedores",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        self.search_var = ctk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._cargar_proveedores())
        ctk.CTkEntry(header, placeholder_text="Buscar proveedor...",
                     width=250, textvariable=self.search_var).pack(side="left", padx=20, pady=15)

        ctk.CTkButton(header, text="+ Nuevo Proveedor", width=160,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._nuevo).pack(side="right", padx=30, pady=15)

        # Content
        content = ctk.CTkFrame(self, fg_color="transparent")
        content.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)
        content.grid_columnconfigure(0, weight=2)
        content.grid_columnconfigure(1, weight=1)
        content.grid_rowconfigure(0, weight=1)

        # Left: list
        list_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        list_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        table_header = ctk.CTkFrame(list_frame, fg_color="#f8f9fa", corner_radius=0)
        table_header.pack(fill="x", padx=10, pady=(10, 2))
        for text, width in [("Nombre", 200), ("Teléfono", 130), ("Email", 200)]:
            ctk.CTkLabel(table_header, text=text, width=width,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         anchor="w").pack(side="left", padx=8, pady=8)

        self.list_scroll = ctk.CTkScrollableFrame(list_frame, fg_color="transparent")
        self.list_scroll.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Right: form + price history
        right = ctk.CTkFrame(content, fg_color="transparent")
        right.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        right.grid_rowconfigure(1, weight=1)
        right.grid_columnconfigure(0, weight=1)

        # Form
        self.detail_frame = ctk.CTkFrame(right, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.detail_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        self._build_form()

        # Price history
        self.history_frame = ctk.CTkFrame(right, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.history_frame.grid(row=1, column=0, sticky="nsew")
        self._build_history_section()

    def _build_form(self):
        ctk.CTkLabel(self.detail_frame, text="Datos del Proveedor",
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=20, pady=(15, 10))

        form = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        form.pack(fill="x", padx=20, pady=(0, 5))

        self.form_fields = {}
        for key, label in [("nombre", "Nombre *"), ("telefono", "Teléfono"),
                           ("email", "Email"), ("direccion", "Dirección")]:
            ctk.CTkLabel(form, text=label, font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(6, 2))
            entry = ctk.CTkEntry(form, height=32)
            entry.pack(fill="x", pady=(0, 2))
            self.form_fields[key] = entry

        ctk.CTkLabel(form, text="Notas", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(6, 2))
        self.notas_text = ctk.CTkTextbox(form, height=60)
        self.notas_text.pack(fill="x", pady=(0, 5))

        btn_frame = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        btn_frame.pack(fill="x", padx=20, pady=(0, 15))

        ctk.CTkButton(btn_frame, text="Guardar", width=100,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar).pack(side="left", padx=(0, 8))
        ctk.CTkButton(btn_frame, text="Desactivar", width=100,
                      fg_color=self.app.COLOR_DANGER, hover_color="#c1121f",
                      command=self._desactivar).pack(side="left")
        ctk.CTkButton(btn_frame, text="Limpiar", width=80,
                      fg_color="#6c757d", hover_color="#495057",
                      command=self._limpiar).pack(side="right")

        self.editing_id = None

    def _build_history_section(self):
        ctk.CTkLabel(self.history_frame, text="Historial de Precios",
                     font=ctk.CTkFont(size=14, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=15, pady=(12, 5))

        # Add price form
        add_frame = ctk.CTkFrame(self.history_frame, fg_color="#f8f9fa", corner_radius=8)
        add_frame.pack(fill="x", padx=15, pady=(0, 5))

        row1 = ctk.CTkFrame(add_frame, fg_color="transparent")
        row1.pack(fill="x", padx=10, pady=(8, 4))

        categorias = self.app.categoria_model.listar()
        cat_names = [c["nombre"] for c in categorias]
        self.cat_combo = ctk.CTkComboBox(row1, values=cat_names, width=140)
        self.cat_combo.pack(side="left", padx=(0, 5))
        self.cat_combo.set("Madera")

        self.desc_entry = ctk.CTkEntry(row1, placeholder_text="Descripción material", width=150)
        self.desc_entry.pack(side="left", padx=5)

        row2 = ctk.CTkFrame(add_frame, fg_color="transparent")
        row2.pack(fill="x", padx=10, pady=(0, 8))

        self.precio_entry = ctk.CTkEntry(row2, placeholder_text="Precio", width=80)
        self.precio_entry.pack(side="left", padx=(0, 5))

        self.unidad_combo = ctk.CTkComboBox(row2, values=["ud", "m", "m²", "barra", "kg", "hora"],
                                             width=80)
        self.unidad_combo.pack(side="left", padx=5)
        self.unidad_combo.set("ud")

        ctk.CTkButton(row2, text="Añadir", width=70,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._add_precio).pack(side="left", padx=5)

        # History list
        self.history_scroll = ctk.CTkScrollableFrame(self.history_frame, fg_color="transparent")
        self.history_scroll.pack(fill="both", expand=True, padx=15, pady=(0, 10))

    def _cargar_proveedores(self):
        for w in self.list_scroll.winfo_children():
            w.destroy()

        texto = self.search_var.get().strip()
        if texto:
            proveedores = self.app.proveedor_model.buscar(texto)
        else:
            proveedores = self.app.proveedor_model.listar()

        if not proveedores:
            ctk.CTkLabel(self.list_scroll, text="No hay proveedores",
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(pady=30)
            return

        for p in proveedores:
            row = ctk.CTkFrame(self.list_scroll, fg_color="transparent", height=36, cursor="hand2")
            row.pack(fill="x", pady=1)
            for text, width in [(p["nombre"], 200), (p["telefono"] or "", 130), (p["email"] or "", 200)]:
                lbl = ctk.CTkLabel(row, text=str(text), width=width,
                                   font=ctk.CTkFont(size=13),
                                   text_color=self.app.COLOR_TEXT, anchor="w")
                lbl.pack(side="left", padx=8)
                lbl.bind("<Button-1>", lambda e, pid=p["id"]: self._seleccionar(pid))
            row.bind("<Button-1>", lambda e, pid=p["id"]: self._seleccionar(pid))

    def _seleccionar(self, proveedor_id):
        prov = self.app.proveedor_model.obtener(proveedor_id)
        if not prov:
            return
        self.editing_id = proveedor_id
        for key, entry in self.form_fields.items():
            entry.delete(0, "end")
            entry.insert(0, prov[key] or "")
        self.notas_text.delete("1.0", "end")
        self.notas_text.insert("1.0", prov["notas"] or "")
        self._cargar_historial()

    def _cargar_historial(self):
        for w in self.history_scroll.winfo_children():
            w.destroy()

        if not self.editing_id:
            return

        historial = self.app.historico_model.historial_por_proveedor(self.editing_id)
        if not historial:
            ctk.CTkLabel(self.history_scroll, text="Sin historial de precios",
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(pady=15)
            return

        for h in historial:
            row = ctk.CTkFrame(self.history_scroll, fg_color="#f8f9fa", corner_radius=6)
            row.pack(fill="x", pady=2)
            fecha = h["fecha_precio"][:10] if h["fecha_precio"] else ""
            text = f"{h['categoria_nombre'] or ''} | {h['descripcion_material']} | {h['precio']:.2f}€/{h['unidad']} | {fecha}"
            ctk.CTkLabel(row, text=text, font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=10, pady=5)

    def _add_precio(self):
        if not self.editing_id:
            messagebox.showwarning("Aviso", "Selecciona un proveedor primero.")
            return

        desc = self.desc_entry.get().strip()
        precio_str = self.precio_entry.get().strip()
        if not desc or not precio_str:
            messagebox.showwarning("Aviso", "Rellena descripción y precio.")
            return

        try:
            precio = float(precio_str.replace(",", "."))
        except ValueError:
            messagebox.showwarning("Aviso", "Precio no válido.")
            return

        cat_nombre = self.cat_combo.get()
        cat = self.app.categoria_model.obtener_por_nombre(cat_nombre)
        cat_id = cat["id"] if cat else None

        self.app.historico_model.registrar_precio(
            self.editing_id, cat_id, desc, precio, self.unidad_combo.get()
        )

        self.desc_entry.delete(0, "end")
        self.precio_entry.delete(0, "end")
        self._cargar_historial()

    def _limpiar(self):
        self.editing_id = None
        for entry in self.form_fields.values():
            entry.delete(0, "end")
        self.notas_text.delete("1.0", "end")
        for w in self.history_scroll.winfo_children():
            w.destroy()

    def _nuevo(self):
        self._limpiar()
        self.form_fields["nombre"].focus()

    def _guardar(self):
        nombre = self.form_fields["nombre"].get().strip()
        if not nombre:
            messagebox.showwarning("Campo requerido", "El nombre es obligatorio.")
            return

        data = {k: v.get().strip() for k, v in self.form_fields.items()}
        data["notas"] = self.notas_text.get("1.0", "end").strip()

        if self.editing_id:
            self.app.proveedor_model.actualizar(self.editing_id, **data)
            messagebox.showinfo("Guardado", f"Proveedor '{nombre}' actualizado.")
        else:
            new_id = self.app.proveedor_model.crear(**data)
            self.editing_id = new_id
            messagebox.showinfo("Guardado", f"Proveedor '{nombre}' creado.")

        self._cargar_proveedores()

    def _desactivar(self):
        if not self.editing_id:
            return
        if messagebox.askyesno("Confirmar", "¿Desactivar este proveedor?"):
            self.app.proveedor_model.desactivar(self.editing_id)
            self._limpiar()
            self._cargar_proveedores()
