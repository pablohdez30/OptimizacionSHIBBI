import customtkinter as ctk
from tkinter import messagebox


class ClientesView(ctk.CTkFrame):
    """Client management view with list and CRUD."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._build_ui()
        self._cargar_clientes()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        ctk.CTkLabel(header, text="Clientes",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        # Search with debounce
        self.search_var = ctk.StringVar()
        self._search_after_id = None
        self.search_var.trace_add("write", lambda *_: self._debounce_search())
        search = ctk.CTkEntry(header, placeholder_text="Buscar cliente...",
                              width=250, textvariable=self.search_var)
        search.pack(side="left", padx=20, pady=15)

        ctk.CTkButton(header, text="+ Nuevo Cliente", width=150,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._nuevo_cliente).pack(side="right", padx=30, pady=15)

        # Content area
        content = ctk.CTkFrame(self, fg_color="transparent")
        content.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)
        content.grid_columnconfigure(0, weight=2)
        content.grid_columnconfigure(1, weight=1)
        content.grid_rowconfigure(0, weight=1)

        # Left: client list
        list_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        list_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        # Table header
        table_header = ctk.CTkFrame(list_frame, fg_color="#f8f9fa", corner_radius=0)
        table_header.pack(fill="x", padx=10, pady=(10, 2))
        for text, width in [("Nombre", 200), ("Teléfono", 120), ("Email", 180), ("NIF/CIF", 100)]:
            ctk.CTkLabel(table_header, text=text, width=width,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         anchor="w").pack(side="left", padx=8, pady=8)

        self.list_scroll = ctk.CTkScrollableFrame(list_frame, fg_color="transparent")
        self.list_scroll.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Right: detail/edit form
        self.detail_frame = ctk.CTkFrame(content, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.detail_frame.grid(row=0, column=1, sticky="nsew", padx=(10, 0))

        self._build_form()

    def _build_form(self):
        for w in self.detail_frame.winfo_children():
            w.destroy()

        ctk.CTkLabel(self.detail_frame, text="Datos del Cliente",
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=20, pady=(15, 10))

        form = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        form.pack(fill="both", expand=True, padx=20, pady=(0, 10))

        self.form_fields = {}
        fields = [
            ("nombre", "Nombre *"),
            ("nif_cif", "NIF/CIF"),
            ("telefono", "Teléfono"),
            ("email", "Email"),
            ("direccion", "Dirección"),
            ("ciudad", "Ciudad"),
            ("codigo_postal", "Código Postal"),
        ]

        for key, label in fields:
            ctk.CTkLabel(form, text=label, font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(8, 2))
            entry = ctk.CTkEntry(form, height=32)
            entry.pack(fill="x", pady=(0, 2))
            self.form_fields[key] = entry

        ctk.CTkLabel(form, text="Notas internas", font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", pady=(8, 2))
        self.notas_text = ctk.CTkTextbox(form, height=80)
        self.notas_text.pack(fill="x", pady=(0, 5))
        self.form_fields["notas"] = self.notas_text

        # Buttons
        btn_frame = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        btn_frame.pack(fill="x", padx=20, pady=(0, 15))

        self.btn_guardar = ctk.CTkButton(btn_frame, text="Guardar", width=120,
                                          fg_color=self.app.COLOR_SUCCESS,
                                          hover_color="#1b4332",
                                          command=self._guardar)
        self.btn_guardar.pack(side="left", padx=(0, 8))

        self.btn_eliminar = ctk.CTkButton(btn_frame, text="Desactivar", width=120,
                                           fg_color=self.app.COLOR_DANGER,
                                           hover_color="#c1121f",
                                           command=self._desactivar)
        self.btn_eliminar.pack(side="left")

        ctk.CTkButton(btn_frame, text="Limpiar", width=80,
                      fg_color="#6c757d", hover_color="#495057",
                      command=self._limpiar_form).pack(side="right")

        self.editing_id = None

    def _debounce_search(self):
        if self._search_after_id:
            self.after_cancel(self._search_after_id)
        self._search_after_id = self.after(300, self._cargar_clientes)

    def _cargar_clientes(self):
        for w in self.list_scroll.winfo_children():
            w.destroy()

        texto = self.search_var.get().strip()
        if texto:
            clientes = self.app.cliente_model.buscar(texto)
        else:
            clientes = self.app.cliente_model.listar()

        if not clientes:
            ctk.CTkLabel(self.list_scroll, text="No hay clientes",
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(pady=30)
            return

        for c in clientes:
            row = ctk.CTkFrame(self.list_scroll, fg_color="transparent",
                               height=38, cursor="hand2")
            row.pack(fill="x", pady=1)

            for text, width in [(c["nombre"], 200), (c["telefono"] or "", 120),
                                (c["email"] or "", 180), (c["nif_cif"] or "", 100)]:
                lbl = ctk.CTkLabel(row, text=str(text), width=width,
                                   font=ctk.CTkFont(size=13),
                                   text_color=self.app.COLOR_TEXT, anchor="w")
                lbl.pack(side="left", padx=8)
                lbl.bind("<Button-1>", lambda e, cid=c["id"]: self._seleccionar(cid))

            row.bind("<Button-1>", lambda e, cid=c["id"]: self._seleccionar(cid))

    def _seleccionar(self, cliente_id):
        cliente = self.app.cliente_model.obtener(cliente_id)
        if not cliente:
            return

        self.editing_id = cliente_id
        for key, entry in self.form_fields.items():
            if key == "notas":
                self.notas_text.delete("1.0", "end")
                self.notas_text.insert("1.0", cliente["notas"] or "")
            else:
                entry.delete(0, "end")
                entry.insert(0, cliente[key] or "")

    def _limpiar_form(self):
        self.editing_id = None
        for key, entry in self.form_fields.items():
            if key == "notas":
                self.notas_text.delete("1.0", "end")
            else:
                entry.delete(0, "end")

    def _nuevo_cliente(self):
        self._limpiar_form()
        self.form_fields["nombre"].focus()

    def _guardar(self):
        nombre = self.form_fields["nombre"].get().strip()
        if not nombre:
            messagebox.showwarning("Campo requerido", "El nombre es obligatorio.")
            return

        data = {}
        for key, entry in self.form_fields.items():
            if key == "notas":
                data[key] = self.notas_text.get("1.0", "end").strip()
            else:
                data[key] = entry.get().strip()

        if self.editing_id:
            self.app.cliente_model.actualizar(self.editing_id, **data)
            messagebox.showinfo("Guardado", f"Cliente '{nombre}' actualizado.")
        else:
            self.app.cliente_model.crear(**data)
            messagebox.showinfo("Guardado", f"Cliente '{nombre}' creado.")

        self._limpiar_form()
        self._cargar_clientes()

    def _desactivar(self):
        if not self.editing_id:
            return
        if messagebox.askyesno("Confirmar", "¿Desactivar este cliente?"):
            self.app.cliente_model.desactivar(self.editing_id)
            self._limpiar_form()
            self._cargar_clientes()
