import customtkinter as ctk
from tkinter import ttk
from app.ui.scrollable_dropdown import ScrollableComboBox


class HistoricoMueblesView(ctk.CTkFrame):
    """Browse furniture historic: prices, categories, clients."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._filter_after_id = None
        self._build_ui()
        self._refresh_table()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        ctk.CTkLabel(header, text="Histórico de Muebles",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        # Filters bar
        filters = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0)
        filters.grid(row=0, column=0, sticky="ew", pady=(70, 0))

        filters_inner = ctk.CTkFrame(filters, fg_color="transparent")
        filters_inner.pack(fill="x", padx=25, pady=10)

        # Category filter
        ctk.CTkLabel(filters_inner, text="Categoría:",
                     font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        cats = self.app.categoria_mueble_model.listar()
        cat_names = ["Todas"] + [c["nombre"] for c in cats]
        self._cat_map = {c["nombre"]: c["id"] for c in cats}
        self.cat_filter = ctk.CTkOptionMenu(filters_inner, values=cat_names,
                                             width=140, height=30,
                                             font=ctk.CTkFont(size=12),
                                             fg_color="#e8e8e8", text_color="#1a1a2e",
                                             button_color="#d0d0d0",
                                             command=lambda _: self._refresh_table())
        self.cat_filter.pack(side="left", padx=(5, 15))

        # Text search
        ctk.CTkLabel(filters_inner, text="Buscar:",
                     font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.search_entry = ctk.CTkEntry(filters_inner, width=200, height=30,
                                          placeholder_text="Nombre o descripción...")
        self.search_entry.pack(side="left", padx=(5, 15))
        self.search_entry.bind("<KeyRelease>", self._on_search_key)

        # Client filter
        ctk.CTkLabel(filters_inner, text="Cliente:",
                     font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        clientes = self.app.cliente_model.listar()
        self._cliente_map = {c["nombre"]: c["id"] for c in clientes}
        client_names = ["Todos"] + sorted(self._cliente_map.keys())
        self.client_combo = ScrollableComboBox(
            filters_inner, values=client_names, width=220, height=30,
            placeholder_text="Todos", dropdown_font_size=14, dropdown_max_items=15,
            min_dropdown_width=300)
        self.client_combo.pack(side="left", padx=(5, 15))
        self.client_combo.set("Todos")

        ctk.CTkButton(filters_inner, text="Filtrar", width=80, height=30,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._refresh_table).pack(side="left", padx=5)

        # Table
        table_frame = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=12)
        table_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        table_frame.grid_columnconfigure(0, weight=1)
        table_frame.grid_rowconfigure(0, weight=1)

        style = ttk.Style()
        style.configure("Hist.Treeview", font=("Segoe UI", 11), rowheight=28)
        style.configure("Hist.Treeview.Heading", font=("Segoe UI", 11, "bold"))

        columns = ("categoria", "nombre", "descripcion", "cliente",
                   "precio_ud", "cant", "fecha", "presupuesto")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings",
                                  style="Hist.Treeview")

        headings = [
            ("categoria", "Categoría", 110),
            ("nombre", "Nombre", 180),
            ("descripcion", "Descripción", 200),
            ("cliente", "Cliente", 160),
            ("precio_ud", "Precio Ud.", 100),
            ("cant", "Cant.", 60),
            ("fecha", "Fecha", 90),
            ("presupuesto", "Nº Presup.", 90),
        ]
        for col, text, w in headings:
            self.tree.heading(col, text=text)
            anchor = "e" if col in ("precio_ud", "cant") else "w"
            self.tree.column(col, width=w, minwidth=50, anchor=anchor)

        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)

        self.tree.grid(row=0, column=0, sticky="nsew", padx=(10, 0), pady=10)
        scrollbar.grid(row=0, column=1, sticky="ns", pady=10)

        self.tree.bind("<Double-1>", self._on_double_click)

        # Status bar
        self.status_label = ctk.CTkLabel(self, text="",
                                          font=ctk.CTkFont(size=11),
                                          text_color=self.app.COLOR_TEXT_LIGHT)
        self.status_label.grid(row=2, column=0, sticky="w", padx=25, pady=(0, 5))

    def _on_search_key(self, event=None):
        if event and event.keysym in ("Shift_L", "Shift_R", "Control_L",
                                       "Control_R", "Alt_L", "Alt_R"):
            return
        if self._filter_after_id:
            self.after_cancel(self._filter_after_id)
        self._filter_after_id = self.after(300, self._refresh_table)

    def _refresh_table(self):
        cat_name = self.cat_filter.get()
        cat_id = self._cat_map.get(cat_name) if cat_name != "Todas" else None

        cliente_name = self.client_combo.get()
        cliente_id = self._cliente_map.get(cliente_name) if cliente_name != "Todos" else None

        texto = self.search_entry.get().strip() or None

        rows = self.app.historico_muebles_model.buscar(
            categoria_mueble_id=cat_id,
            cliente_id=cliente_id,
            texto=texto)

        self.tree.delete(*self.tree.get_children())
        for r in rows:
            from datetime import datetime
            try:
                fecha = datetime.strptime(r["fecha"], "%Y-%m-%d").strftime("%d/%m/%Y")
            except (ValueError, TypeError):
                fecha = r["fecha"] or ""
            self.tree.insert("", "end", values=(
                r["categoria_nombre"] or "(Sin cat.)",
                r["nombre"] or "",
                r["descripcion"] or "",
                r["cliente_nombre"] or "(Eliminado)",
                f"{r['precio_unitario']:,.2f}€",
                r["cantidad"] or 1,
                fecha,
                r["numero_presupuesto"] or "",
            ), iid=str(r["id"]),
               tags=(str(r.get("presupuesto_id", "")),))

        self.status_label.configure(text=f"{len(rows)} registros")

    def _on_double_click(self, event=None):
        sel = self.tree.selection()
        if not sel:
            return
        tags = self.tree.item(sel[0], "tags")
        if tags and tags[0]:
            try:
                pres_id = int(tags[0])
                self.app.show_nuevo_presupuesto(presupuesto_id=pres_id)
            except (ValueError, TypeError):
                pass
