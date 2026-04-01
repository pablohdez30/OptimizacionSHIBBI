import customtkinter as ctk
from tkinter import messagebox


class ProveedoresView(ctk.CTkFrame):
    """Supplier management view with list, CRUD, and editable materials catalog."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._search_after_id = None
        self._mat_search_after_id = None
        self._all_materials = {}  # Full grouped materials cache
        self._build_ui()
        self._cargar_proveedores()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        ctk.CTkLabel(header, text="Proveedores", font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)
        self.search_var = ctk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._debounce_search())
        ctk.CTkEntry(header, placeholder_text="Buscar proveedor...",
                     width=250, textvariable=self.search_var).pack(side="left", padx=20, pady=15)
        ctk.CTkButton(header, text="+ Nuevo Proveedor", width=160,
                      fg_color=self.app.COLOR_ACCENT, hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._nuevo).pack(side="right", padx=30, pady=15)

        content = ctk.CTkFrame(self, fg_color="transparent")
        content.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)
        content.grid_columnconfigure(0, weight=1)
        content.grid_columnconfigure(1, weight=1)
        content.grid_columnconfigure(2, weight=2)
        content.grid_rowconfigure(0, weight=1)

        # Left: supplier list
        list_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        list_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        ctk.CTkLabel(list_frame, text="Proveedores", font=ctk.CTkFont(size=14, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=15, pady=(12, 5))
        self.list_scroll = ctk.CTkScrollableFrame(list_frame, fg_color="transparent")
        self.list_scroll.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Middle: form
        self.detail_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.detail_frame.grid(row=0, column=1, sticky="nsew", padx=8)
        self._build_form()

        # Right: materials catalog
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
        header_frame = ctk.CTkFrame(self.materials_frame, fg_color="transparent")
        header_frame.pack(fill="x", padx=15, pady=(12, 5))
        ctk.CTkLabel(header_frame, text="Catálogo de Materiales",
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.prov_name_label = ctk.CTkLabel(header_frame, text="",
                                             font=ctk.CTkFont(size=13),
                                             text_color=self.app.COLOR_ACCENT)
        self.prov_name_label.pack(side="left", padx=(10, 0))

        # Material search
        search_frame = ctk.CTkFrame(self.materials_frame, fg_color="transparent")
        search_frame.pack(fill="x", padx=15, pady=(0, 5))
        self.mat_search_var = ctk.StringVar()
        self.mat_search_var.trace_add("write", lambda *_: self._debounce_mat_search())
        ctk.CTkEntry(search_frame, placeholder_text="Buscar material...",
                     width=300, height=28, textvariable=self.mat_search_var).pack(side="left")
        self.mat_count_label = ctk.CTkLabel(search_frame, text="",
                                             font=ctk.CTkFont(size=11),
                                             text_color=self.app.COLOR_TEXT_LIGHT)
        self.mat_count_label.pack(side="right", padx=10)

        # Add material form
        add_frame = ctk.CTkFrame(self.materials_frame, fg_color="#f8f9fa", corner_radius=8)
        add_frame.pack(fill="x", padx=15, pady=(0, 5))
        row1 = ctk.CTkFrame(add_frame, fg_color="transparent")
        row1.pack(fill="x", padx=10, pady=(8, 4))
        categorias = self.app.categoria_model.listar()
        cat_names = [c["nombre"] for c in categorias]
        ctk.CTkLabel(row1, text="Cat:", font=ctk.CTkFont(size=11),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 3))
        self.cat_combo = ctk.CTkOptionMenu(row1, values=cat_names, width=110, height=26,
                                            font=ctk.CTkFont(size=11))
        self.cat_combo.pack(side="left", padx=(0, 8))
        self.cat_combo.set("Madera")
        ctk.CTkLabel(row1, text="Material:", font=ctk.CTkFont(size=11),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 3))
        self.desc_entry = ctk.CTkEntry(row1, placeholder_text="Nombre material...",
                                        width=180, height=26)
        self.desc_entry.pack(side="left", padx=(0, 8))
        row2 = ctk.CTkFrame(add_frame, fg_color="transparent")
        row2.pack(fill="x", padx=10, pady=(0, 6))
        ctk.CTkLabel(row2, text="Precio:", font=ctk.CTkFont(size=11),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 3))
        self.precio_entry = ctk.CTkEntry(row2, placeholder_text="0.00", width=70, height=26)
        self.precio_entry.pack(side="left", padx=(0, 8))
        ctk.CTkLabel(row2, text="Ud:", font=ctk.CTkFont(size=11),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(0, 3))
        self.unidad_combo = ctk.CTkOptionMenu(row2, values=["ud", "m", "m²", "barra", "kg", "hora", "litro"],
                                               width=65, height=26, font=ctk.CTkFont(size=11))
        self.unidad_combo.pack(side="left", padx=(0, 8))
        self.unidad_combo.set("ud")
        ctk.CTkButton(row2, text="+ Añadir", width=80, height=26,
                      fg_color=self.app.COLOR_ACCENT, hover_color=self.app.COLOR_ACCENT_HOVER,
                      font=ctk.CTkFont(size=11),
                      command=self._add_precio).pack(side="left")

        # Table header - use grid for aligned columns
        th = ctk.CTkFrame(self.materials_frame, fg_color="#f0f2f5", corner_radius=0)
        th.pack(fill="x", padx=15, pady=(0, 2))
        th.grid_columnconfigure(1, weight=1)
        cols = [("Cat.", 0, 70), ("Material", 1, 0), ("Precio", 2, 65),
                ("Ud.", 3, 35), ("Fecha", 4, 75), ("", 5, 25)]
        for text, col, w in cols:
            lbl = ctk.CTkLabel(th, text=text, font=ctk.CTkFont(size=11, weight="bold"),
                               text_color=self.app.COLOR_TEXT_LIGHT, anchor="w")
            if w > 0:
                lbl.configure(width=w)
            lbl.grid(row=0, column=col, padx=3, pady=5, sticky="w")

        self.materials_scroll = ctk.CTkScrollableFrame(self.materials_frame, fg_color="transparent")
        self.materials_scroll.pack(fill="both", expand=True, padx=15, pady=(0, 10))

    def _debounce_search(self):
        if self._search_after_id:
            self.after_cancel(self._search_after_id)
        self._search_after_id = self.after(300, self._cargar_proveedores)

    def _debounce_mat_search(self):
        if self._mat_search_after_id:
            self.after_cancel(self._mat_search_after_id)
        self._mat_search_after_id = self.after(300, self._filtrar_materiales)

    def _cargar_proveedores(self):
        for w in self.list_scroll.winfo_children():
            w.destroy()
        texto = self.search_var.get().strip()
        proveedores = self.app.proveedor_model.buscar(texto) if texto else self.app.proveedor_model.listar()
        if not proveedores:
            ctk.CTkLabel(self.list_scroll, text="No hay proveedores",
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(pady=30)
            return

        # Batch query: get material counts for all providers in one query
        mat_counts = {}
        rows = self.app.db.fetchall(
            "SELECT proveedor_id, COUNT(DISTINCT descripcion_material) as c FROM historico_precios_proveedor GROUP BY proveedor_id")
        for r in rows:
            mat_counts[r["proveedor_id"]] = r["c"]

        for p in proveedores:
            row = ctk.CTkFrame(self.list_scroll, fg_color="transparent", height=36, cursor="hand2")
            row.pack(fill="x", pady=1)
            lbl = ctk.CTkLabel(row, text=p["nombre"], font=ctk.CTkFont(size=13),
                               text_color=self.app.COLOR_TEXT, anchor="w")
            lbl.pack(side="left", padx=10, fill="x", expand=True)
            lbl.bind("<Button-1>", lambda e, pid=p["id"]: self._seleccionar(pid))
            row.bind("<Button-1>", lambda e, pid=p["id"]: self._seleccionar(pid))
            count = mat_counts.get(p["id"], 0)
            if count > 0:
                ctk.CTkLabel(row, text=f"{count} mat.", font=ctk.CTkFont(size=11),
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
        self.mat_search_var.set("")
        self._cargar_materiales()

    def _cargar_materiales(self):
        """Load all materials for current provider into cache, then display."""
        self._all_materials = {}
        if not self.editing_id:
            self._render_materiales({})
            return
        historial = self.app.historico_model.historial_por_proveedor(self.editing_id)
        if not historial:
            self._render_materiales({})
            return
        for h in historial:
            key = h["descripcion_material"]
            if key not in self._all_materials:
                self._all_materials[key] = []
            self._all_materials[key].append(h)
        self._filtrar_materiales()

    def _filtrar_materiales(self):
        """Filter materials by search text and render."""
        search = self.mat_search_var.get().strip().lower()
        if search:
            filtered = {k: v for k, v in self._all_materials.items() if search in k.lower()}
        else:
            filtered = self._all_materials
        self._render_materiales(filtered)

    def _render_materiales(self, materials_dict):
        for w in self.materials_scroll.winfo_children():
            w.destroy()

        total = len(self._all_materials)
        shown = len(materials_dict)
        if total > 0:
            self.mat_count_label.configure(text=f"{shown}/{total} materiales")
        else:
            self.mat_count_label.configure(text="")

        if not materials_dict:
            msg = "Sin materiales." if not self._all_materials else "Sin resultados."
            if not self.editing_id:
                msg = "Selecciona un proveedor"
            ctk.CTkLabel(self.materials_scroll, text=msg,
                         text_color=self.app.COLOR_TEXT_LIGHT, font=ctk.CTkFont(size=13)).pack(pady=20)
            return

        # Grid-based aligned rows
        self.materials_scroll.grid_columnconfigure(1, weight=1)

        r = 0
        for material_name, entries in materials_dict.items():
            latest = entries[0]

            ctk.CTkLabel(self.materials_scroll, text=latest["categoria_nombre"] or "",
                         font=ctk.CTkFont(size=11), text_color=self.app.COLOR_TEXT_LIGHT,
                         width=70, anchor="w").grid(row=r, column=0, padx=3, pady=2, sticky="w")

            ctk.CTkLabel(self.materials_scroll, text=material_name,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_TEXT, anchor="w").grid(row=r, column=1, padx=3, pady=2, sticky="w")

            ctk.CTkLabel(self.materials_scroll, text=f"{latest['precio']:.2f}€",
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_ACCENT, width=65, anchor="e").grid(row=r, column=2, padx=3, pady=2)

            ctk.CTkLabel(self.materials_scroll, text=latest["unidad"],
                         font=ctk.CTkFont(size=11), text_color=self.app.COLOR_TEXT_LIGHT,
                         width=35, anchor="w").grid(row=r, column=3, padx=3, pady=2)

            fecha = latest["fecha_precio"][:10] if latest["fecha_precio"] else ""
            ctk.CTkLabel(self.materials_scroll, text=fecha,
                         font=ctk.CTkFont(size=10), text_color=self.app.COLOR_TEXT_LIGHT,
                         width=75, anchor="w").grid(row=r, column=4, padx=3, pady=2)

            ctk.CTkButton(self.materials_scroll, text="x", width=22, height=22,
                          fg_color="#dc3545", hover_color="#c1121f",
                          font=ctk.CTkFont(size=10),
                          command=lambda eid=latest["id"]: self._delete_material(eid)
                          ).grid(row=r, column=5, padx=3, pady=2)
            r += 1

    def _delete_material(self, historico_id):
        if messagebox.askyesno("Confirmar", "¿Eliminar este registro de precio?"):
            self.app.db.execute("DELETE FROM historico_precios_proveedor WHERE id = ?", (historico_id,))
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
        self.app.historico_model.registrar_precio(
            self.editing_id, cat["id"] if cat else None, desc, precio, self.unidad_combo.get())
        self.desc_entry.delete(0, "end")
        self.precio_entry.delete(0, "end")
        self._cargar_materiales()

    def _limpiar(self):
        self.editing_id = None
        for entry in self.form_fields.values():
            entry.delete(0, "end")
        self.notas_text.delete("1.0", "end")
        self.prov_name_label.configure(text="")
        self._all_materials = {}
        self._render_materiales({})

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
            self.editing_id = self.app.proveedor_model.crear(**data)
            messagebox.showinfo("Guardado", f"Proveedor '{nombre}' creado.")
        self._cargar_proveedores()

    def _desactivar(self):
        if not self.editing_id:
            return
        if messagebox.askyesno("Confirmar", "¿Desactivar este proveedor?"):
            self.app.proveedor_model.desactivar(self.editing_id)
            self._limpiar()
            self._cargar_proveedores()
