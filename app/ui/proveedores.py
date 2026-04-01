import customtkinter as ctk
from tkinter import messagebox


class ProveedoresView(ctk.CTkFrame):
    """Supplier management view with list, CRUD, and editable materials catalog."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._search_after_id = None
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
        self.search_var.trace_add("write", lambda *_: self._debounce_search())
        ctk.CTkEntry(header, placeholder_text="Buscar proveedor...",
                     width=250, textvariable=self.search_var).pack(side="left", padx=20, pady=15)

        ctk.CTkButton(header, text="+ Nuevo Proveedor", width=160,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._nuevo).pack(side="right", padx=30, pady=15)

        # Content - 3 sections: left list, middle form, right materials
        content = ctk.CTkFrame(self, fg_color="transparent")
        content.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)
        content.grid_columnconfigure(0, weight=1)
        content.grid_columnconfigure(1, weight=1)
        content.grid_columnconfigure(2, weight=2)
        content.grid_rowconfigure(0, weight=1)

        # Left: supplier list
        list_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        list_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        ctk.CTkLabel(list_frame, text="Proveedores",
                     font=ctk.CTkFont(size=14, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=15, pady=(12, 5))

        self.list_scroll = ctk.CTkScrollableFrame(list_frame, fg_color="transparent")
        self.list_scroll.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Middle: form
        self.detail_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.detail_frame.grid(row=0, column=1, sticky="nsew", padx=8)
        self._build_form()

        # Right: materials catalog (the big one)
        self.materials_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.materials_frame.grid(row=0, column=2, sticky="nsew", padx=(8, 0))
        self._build_materials_section()

    def _build_form(self):
        ctk.CTkLabel(self.detail_frame, text="Datos del Proveedor",
                     font=ctk.CTkFont(size=14, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=15, pady=(12, 8))

        form = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        form.pack(fill="x", padx=15, pady=(0, 5))

        self.form_fields = {}
        for key, label in [("nombre", "Nombre *"), ("telefono", "Teléfono"),
                           ("email", "Email"), ("direccion", "Dirección")]:
            ctk.CTkLabel(form, text=label, font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(4, 1))
            entry = ctk.CTkEntry(form, height=30)
            entry.pack(fill="x", pady=(0, 2))
            self.form_fields[key] = entry

        ctk.CTkLabel(form, text="Notas", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(4, 1))
        self.notas_text = ctk.CTkTextbox(form, height=60)
        self.notas_text.pack(fill="x", pady=(0, 5))

        btn_frame = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        btn_frame.pack(fill="x", padx=15, pady=(0, 12))

        ctk.CTkButton(btn_frame, text="Guardar", width=90, height=30,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar).pack(side="left", padx=(0, 5))
        ctk.CTkButton(btn_frame, text="Desactivar", width=90, height=30,
                      fg_color=self.app.COLOR_DANGER, hover_color="#c1121f",
                      command=self._desactivar).pack(side="left")
        ctk.CTkButton(btn_frame, text="Limpiar", width=70, height=30,
                      fg_color="#6c757d", hover_color="#495057",
                      command=self._limpiar).pack(side="right")

        self.editing_id = None

    def _build_materials_section(self):
        """Build the large materials catalog section."""
        header_frame = ctk.CTkFrame(self.materials_frame, fg_color="transparent")
        header_frame.pack(fill="x", padx=15, pady=(12, 5))

        ctk.CTkLabel(header_frame, text="Catálogo de Materiales",
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")

        self.prov_name_label = ctk.CTkLabel(header_frame, text="",
                                             font=ctk.CTkFont(size=13),
                                             text_color=self.app.COLOR_ACCENT)
        self.prov_name_label.pack(side="left", padx=(10, 0))

        # Add material form
        add_frame = ctk.CTkFrame(self.materials_frame, fg_color="#f8f9fa", corner_radius=8)
        add_frame.pack(fill="x", padx=15, pady=(0, 8))

        row1 = ctk.CTkFrame(add_frame, fg_color="transparent")
        row1.pack(fill="x", padx=10, pady=(8, 4))

        categorias = self.app.categoria_model.listar()
        cat_names = [c["nombre"] for c in categorias]

        ctk.CTkLabel(row1, text="Categoría:", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 5))
        self.cat_combo = ctk.CTkComboBox(row1, values=cat_names, width=130, height=28)
        self.cat_combo.pack(side="left", padx=(0, 10))
        self.cat_combo.set("Madera")

        ctk.CTkLabel(row1, text="Material:", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 5))
        self.desc_entry = ctk.CTkEntry(row1, placeholder_text="Ej: Madera Iroco, Tubo 40x20...",
                                        width=200, height=28)
        self.desc_entry.pack(side="left", padx=(0, 10))

        row2 = ctk.CTkFrame(add_frame, fg_color="transparent")
        row2.pack(fill="x", padx=10, pady=(0, 8))

        ctk.CTkLabel(row2, text="Precio:", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 5))
        self.precio_entry = ctk.CTkEntry(row2, placeholder_text="0.00", width=80, height=28)
        self.precio_entry.pack(side="left", padx=(0, 10))

        ctk.CTkLabel(row2, text="Unidad:", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 5))
        self.unidad_combo = ctk.CTkComboBox(row2, values=["ud", "m", "m²", "barra", "kg", "hora", "litro"],
                                             width=80, height=28)
        self.unidad_combo.pack(side="left", padx=(0, 10))
        self.unidad_combo.set("ud")

        ctk.CTkButton(row2, text="+ Añadir Material", width=130, height=28,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._add_precio).pack(side="left", padx=5)

        # Table header
        table_header = ctk.CTkFrame(self.materials_frame, fg_color="#f0f2f5", corner_radius=0)
        table_header.pack(fill="x", padx=15, pady=(0, 2))
        cols = [("Categoría", 110), ("Material", 180), ("Precio", 80),
                ("Ud.", 50), ("Fecha", 85), ("", 30)]
        for text, width in cols:
            ctk.CTkLabel(table_header, text=text, width=width,
                         font=ctk.CTkFont(size=11, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         anchor="w").pack(side="left", padx=4, pady=6)

        # Scrollable materials list
        self.materials_scroll = ctk.CTkScrollableFrame(self.materials_frame, fg_color="transparent")
        self.materials_scroll.pack(fill="both", expand=True, padx=15, pady=(0, 10))

    def _debounce_search(self):
        if self._search_after_id:
            self.after_cancel(self._search_after_id)
        self._search_after_id = self.after(300, self._cargar_proveedores)

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
            lbl = ctk.CTkLabel(row, text=p["nombre"],
                               font=ctk.CTkFont(size=13),
                               text_color=self.app.COLOR_TEXT, anchor="w")
            lbl.pack(side="left", padx=10, fill="x", expand=True)
            lbl.bind("<Button-1>", lambda e, pid=p["id"]: self._seleccionar(pid))
            row.bind("<Button-1>", lambda e, pid=p["id"]: self._seleccionar(pid))

            # Show material count
            historial = self.app.historico_model.historial_por_proveedor(p["id"])
            # Count unique materials (latest price only)
            seen = set()
            count = 0
            for h in historial:
                if h["descripcion_material"] not in seen:
                    seen.add(h["descripcion_material"])
                    count += 1
            if count > 0:
                ctk.CTkLabel(row, text=f"{count} mat.",
                             font=ctk.CTkFont(size=11),
                             text_color=self.app.COLOR_TEXT_LIGHT).pack(side="right", padx=8)

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
        self.prov_name_label.configure(text=f"- {prov['nombre']}")
        self._cargar_materiales()

    def _cargar_materiales(self):
        for w in self.materials_scroll.winfo_children():
            w.destroy()

        if not self.editing_id:
            ctk.CTkLabel(self.materials_scroll,
                         text="Selecciona un proveedor para ver sus materiales",
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(pady=30)
            return

        historial = self.app.historico_model.historial_por_proveedor(self.editing_id)
        if not historial:
            ctk.CTkLabel(self.materials_scroll,
                         text="Sin materiales. Añade el primero con el formulario de arriba.",
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         font=ctk.CTkFont(size=13)).pack(pady=30)
            return

        # Group by material, show latest price first (but all history)
        seen_materials = {}
        for h in historial:
            key = h["descripcion_material"]
            if key not in seen_materials:
                seen_materials[key] = []
            seen_materials[key].append(h)

        for material_name, entries in seen_materials.items():
            latest = entries[0]  # Already sorted DESC
            row = ctk.CTkFrame(self.materials_scroll, fg_color="transparent", height=34)
            row.pack(fill="x", pady=1)

            ctk.CTkLabel(row, text=latest["categoria_nombre"] or "", width=110,
                         font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=4)

            ctk.CTkLabel(row, text=material_name, width=180,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=4)

            ctk.CTkLabel(row, text=f"{latest['precio']:.2f}€", width=80,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_ACCENT, anchor="w").pack(side="left", padx=4)

            ctk.CTkLabel(row, text=latest["unidad"], width=50,
                         font=ctk.CTkFont(size=11),
                         text_color=self.app.COLOR_TEXT_LIGHT, anchor="w").pack(side="left", padx=4)

            fecha = latest["fecha_precio"][:10] if latest["fecha_precio"] else ""
            ctk.CTkLabel(row, text=fecha, width=85,
                         font=ctk.CTkFont(size=11),
                         text_color=self.app.COLOR_TEXT_LIGHT, anchor="w").pack(side="left", padx=4)

            # Delete button
            ctk.CTkButton(row, text="x", width=24, height=24,
                          fg_color="#dc3545", hover_color="#c1121f",
                          font=ctk.CTkFont(size=11),
                          command=lambda eid=latest["id"]: self._delete_material(eid)
                          ).pack(side="left", padx=4)

            # Show price history if multiple entries
            if len(entries) > 1:
                hist_text = "  Historial: " + " → ".join(
                    f"{e['precio']:.2f}€ ({e['fecha_precio'][:10]})"
                    for e in reversed(entries)
                )
                hist_row = ctk.CTkFrame(self.materials_scroll, fg_color="#f8f9fa",
                                         corner_radius=4)
                hist_row.pack(fill="x", padx=20, pady=(0, 2))
                ctk.CTkLabel(hist_row, text=hist_text,
                             font=ctk.CTkFont(size=10),
                             text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", padx=8, pady=3)

    def _delete_material(self, historico_id):
        if messagebox.askyesno("Confirmar", "¿Eliminar este registro de precio?"):
            self.app.db.execute(
                "DELETE FROM historico_precios_proveedor WHERE id = ?", (historico_id,)
            )
            self._cargar_materiales()

    def _add_precio(self):
        if not self.editing_id:
            messagebox.showwarning("Aviso", "Selecciona un proveedor primero.")
            return

        desc = self.desc_entry.get().strip()
        precio_str = self.precio_entry.get().strip()
        if not desc or not precio_str:
            messagebox.showwarning("Aviso", "Rellena material y precio.")
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
        self._cargar_materiales()

    def _limpiar(self):
        self.editing_id = None
        for entry in self.form_fields.values():
            entry.delete(0, "end")
        self.notas_text.delete("1.0", "end")
        self.prov_name_label.configure(text="")
        for w in self.materials_scroll.winfo_children():
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
