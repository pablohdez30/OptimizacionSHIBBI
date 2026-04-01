import customtkinter as ctk
from tkinter import messagebox


class PresupuestosView(ctk.CTkFrame):
    """Budget list view with filtering and state management."""

    ESTADOS = ["Todos", "Borrador", "Enviado", "Aceptado", "Rechazado",
               "En producción", "Entregado"]

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._build_ui()
        self._cargar()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        ctk.CTkLabel(header, text="Presupuestos",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        # Filter by state
        ctk.CTkLabel(header, text="Estado:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(20, 5))

        self.estado_var = ctk.StringVar(value="Todos")
        self.estado_combo = ctk.CTkComboBox(header, values=self.ESTADOS, width=150,
                                             variable=self.estado_var,
                                             command=lambda _: self._cargar())
        self.estado_combo.pack(side="left", padx=5)

        ctk.CTkButton(header, text="+ Nuevo Presupuesto", width=170,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=lambda: self.app._show_view("nuevo_presupuesto")
                      ).pack(side="right", padx=30, pady=15)

        # Table
        table_frame = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=12)
        table_frame.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)

        # Table header
        th = ctk.CTkFrame(table_frame, fg_color="#f8f9fa", corner_radius=0)
        th.pack(fill="x", padx=10, pady=(10, 2))
        cols = [("Nº", 80), ("Cliente", 200), ("Fecha", 100), ("Estado", 120),
                ("Total (IVA inc.)", 130), ("Acciones", 260)]
        for text, width in cols:
            ctk.CTkLabel(th, text=text, width=width,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         anchor="w").pack(side="left", padx=8, pady=8)

        self.list_scroll = ctk.CTkScrollableFrame(table_frame, fg_color="transparent")
        self.list_scroll.pack(fill="both", expand=True, padx=10, pady=(0, 10))

    def _cargar(self):
        for w in self.list_scroll.winfo_children():
            w.destroy()

        estado = self.estado_var.get()
        if estado == "Todos":
            presupuestos = self.app.presupuesto_model.listar()
        else:
            presupuestos = self.app.presupuesto_model.listar(estado=estado)

        if not presupuestos:
            ctk.CTkLabel(self.list_scroll, text="No hay presupuestos con este filtro.",
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         font=ctk.CTkFont(size=14)).pack(pady=40)
            return

        estado_colors = {
            "Borrador": "#6c757d", "Enviado": "#0077b6",
            "Aceptado": self.app.COLOR_SUCCESS, "Rechazado": self.app.COLOR_DANGER,
            "En producción": "#e9c46a", "Entregado": "#2d6a4f"
        }

        iva_pct = self.app.config_model.obtener_float("iva_porcentaje", 21)

        for p in presupuestos:
            row = ctk.CTkFrame(self.list_scroll, fg_color="transparent", height=42)
            row.pack(fill="x", pady=1)

            total_base = self.app.presupuesto_model.calcular_total_presupuesto(p["id"])
            total_iva = total_base * (1 + iva_pct / 100)

            ctk.CTkLabel(row, text=p["numero_presupuesto"], width=80,
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=8)
            ctk.CTkLabel(row, text=p["cliente_nombre"], width=200,
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=8)
            ctk.CTkLabel(row, text=p["fecha"], width=100,
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=8)
            ctk.CTkLabel(row, text=p["estado"], width=120,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=estado_colors.get(p["estado"], "#6c757d"),
                         anchor="w").pack(side="left", padx=8)
            ctk.CTkLabel(row, text=f"{total_iva:,.2f}€", width=130,
                         font=ctk.CTkFont(size=13, weight="bold"),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=8)

            # Action buttons
            actions = ctk.CTkFrame(row, fg_color="transparent")
            actions.pack(side="left", padx=8)

            ctk.CTkButton(actions, text="Editar", width=55, height=26,
                          font=ctk.CTkFont(size=11),
                          fg_color="#0077b6", hover_color="#005f8a",
                          command=lambda pid=p["id"]: self.app.show_nuevo_presupuesto(pid)
                          ).pack(side="left", padx=2)

            ctk.CTkButton(actions, text="Duplicar", width=60, height=26,
                          font=ctk.CTkFont(size=11),
                          fg_color="#6c757d", hover_color="#495057",
                          command=lambda pid=p["id"]: self._duplicar(pid)
                          ).pack(side="left", padx=2)

            # State change dropdown
            next_states = {
                "Borrador": ["Enviado", "Rechazado"],
                "Enviado": ["Aceptado", "Rechazado"],
                "Aceptado": ["En producción"],
                "En producción": ["Entregado"],
            }
            if p["estado"] in next_states:
                states = next_states[p["estado"]]
                for s in states:
                    color = estado_colors.get(s, "#6c757d")
                    ctk.CTkButton(actions, text=s, width=70, height=26,
                                  font=ctk.CTkFont(size=11),
                                  fg_color=color,
                                  command=lambda pid=p["id"], st=s: self._cambiar_estado(pid, st)
                                  ).pack(side="left", padx=2)

            ctk.CTkButton(actions, text="Eliminar", width=60, height=26,
                          font=ctk.CTkFont(size=11),
                          fg_color=self.app.COLOR_DANGER, hover_color="#c1121f",
                          command=lambda pid=p["id"]: self._eliminar(pid)
                          ).pack(side="left", padx=2)

    def _cambiar_estado(self, presupuesto_id, nuevo_estado):
        self.app.presupuesto_model.actualizar_estado(presupuesto_id, nuevo_estado)
        self._cargar()

    def _duplicar(self, presupuesto_id):
        new_id = self.app.presupuesto_model.duplicar(presupuesto_id)
        if new_id:
            messagebox.showinfo("Duplicado", "Presupuesto duplicado correctamente.")
            self._cargar()

    def _eliminar(self, presupuesto_id):
        if messagebox.askyesno("Confirmar", "¿Eliminar este presupuesto? Esta acción no se puede deshacer."):
            self.app.presupuesto_model.eliminar(presupuesto_id)
            self._cargar()
