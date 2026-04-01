import customtkinter as ctk
from datetime import datetime, timedelta


class DashboardView(ctk.CTkFrame):
    """Main dashboard with summary stats."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._build_ui()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        ctk.CTkLabel(header, text="Dashboard",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        # Stats cards
        stats_frame = ctk.CTkFrame(self, fg_color="transparent")
        stats_frame.grid(row=1, column=0, sticky="ew", padx=25, pady=(20, 10))
        for i in range(4):
            stats_frame.grid_columnconfigure(i, weight=1)

        stats = self._get_stats()

        card_data = [
            ("Presupuestos\nPendientes", str(stats["pendientes"]), self.app.COLOR_WARNING),
            ("Aceptados\nEste Mes", str(stats["aceptados_mes"]), self.app.COLOR_SUCCESS),
            ("Facturación\nEstimada", f"{stats['facturacion']:,.2f}€", self.app.COLOR_ACCENT),
            ("Total\nClientes", str(stats["total_clientes"]), "#0077b6"),
        ]

        for i, (title, value, color) in enumerate(card_data):
            card = ctk.CTkFrame(stats_frame, fg_color=self.app.COLOR_CARD,
                                corner_radius=12, height=120)
            card.grid(row=0, column=i, sticky="ew", padx=8, pady=5)
            card.grid_propagate(False)

            color_bar = ctk.CTkFrame(card, width=4, fg_color=color, corner_radius=2)
            color_bar.pack(side="left", fill="y", padx=(12, 0), pady=15)

            info = ctk.CTkFrame(card, fg_color="transparent")
            info.pack(side="left", fill="both", expand=True, padx=15, pady=15)

            ctk.CTkLabel(info, text=title,
                         font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         justify="left").pack(anchor="w")
            ctk.CTkLabel(info, text=value,
                         font=ctk.CTkFont(size=28, weight="bold"),
                         text_color=self.app.COLOR_TEXT).pack(anchor="w", pady=(5, 0))

        # Recent budgets
        recent_frame = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD,
                                     corner_radius=12)
        recent_frame.grid(row=2, column=0, sticky="nsew", padx=25, pady=(10, 20))
        self.grid_rowconfigure(2, weight=1)

        ctk.CTkLabel(recent_frame, text="Últimos Presupuestos",
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(anchor="w", padx=20, pady=(15, 10))

        # Table header
        table_header = ctk.CTkFrame(recent_frame, fg_color="#f8f9fa", corner_radius=0)
        table_header.pack(fill="x", padx=15, pady=(0, 2))
        cols = [("Nº", 80), ("Cliente", 250), ("Fecha", 120), ("Estado", 120), ("Total", 120)]
        for text, width in cols:
            ctk.CTkLabel(table_header, text=text, width=width,
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         anchor="w").pack(side="left", padx=10, pady=8)

        # Table rows
        presupuestos = self.app.presupuesto_model.listar()
        scroll = ctk.CTkScrollableFrame(recent_frame, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=15, pady=(0, 15))

        if not presupuestos:
            ctk.CTkLabel(scroll, text="No hay presupuestos aún. ¡Crea el primero!",
                         font=ctk.CTkFont(size=14),
                         text_color=self.app.COLOR_TEXT_LIGHT).pack(pady=40)
        else:
            for p in presupuestos[:20]:
                row = ctk.CTkFrame(scroll, fg_color="transparent", height=40)
                row.pack(fill="x", pady=1)

                total = self.app.presupuesto_model.calcular_total_presupuesto(p["id"])
                iva = self.app.config_model.obtener_float("iva_porcentaje", 21)
                total_iva = total * (1 + iva / 100)

                estado_colors = {
                    "Borrador": "#6c757d", "Enviado": "#0077b6",
                    "Aceptado": self.app.COLOR_SUCCESS, "Rechazado": self.app.COLOR_DANGER,
                    "En producción": "#e9c46a", "Entregado": "#2d6a4f"
                }

                vals = [
                    (p["numero_presupuesto"], 80),
                    (p["cliente_nombre"], 250),
                    (p["fecha"], 120),
                ]
                for text, width in vals:
                    ctk.CTkLabel(row, text=str(text), width=width,
                                 font=ctk.CTkFont(size=13),
                                 text_color=self.app.COLOR_TEXT,
                                 anchor="w").pack(side="left", padx=10)

                estado_label = ctk.CTkLabel(
                    row, text=p["estado"], width=120,
                    font=ctk.CTkFont(size=12, weight="bold"),
                    text_color=estado_colors.get(p["estado"], "#6c757d"),
                    anchor="w"
                )
                estado_label.pack(side="left", padx=10)

                ctk.CTkLabel(row, text=f"{total_iva:,.2f}€", width=120,
                             font=ctk.CTkFont(size=13, weight="bold"),
                             text_color=self.app.COLOR_TEXT,
                             anchor="w").pack(side="left", padx=10)

                # Edit button
                edit_btn = ctk.CTkButton(
                    row, text="Ver", width=60, height=28,
                    font=ctk.CTkFont(size=12),
                    fg_color=self.app.COLOR_ACCENT,
                    hover_color=self.app.COLOR_ACCENT_HOVER,
                    corner_radius=6,
                    command=lambda pid=p["id"]: self.app.show_nuevo_presupuesto(pid)
                )
                edit_btn.pack(side="left", padx=10)

    def _get_stats(self):
        now = datetime.now()
        first_day = now.replace(day=1).strftime("%Y-%m-%d")

        presupuestos = self.app.presupuesto_model.listar()
        pendientes = sum(1 for p in presupuestos if p["estado"] in ("Borrador", "Enviado"))
        aceptados_mes = sum(
            1 for p in presupuestos
            if p["estado"] == "Aceptado" and p["fecha_aceptacion"]
            and p["fecha_aceptacion"] >= first_day
        )

        facturacion = 0
        for p in presupuestos:
            if p["estado"] == "Aceptado" and p["fecha_aceptacion"] and p["fecha_aceptacion"] >= first_day:
                facturacion += self.app.presupuesto_model.calcular_total_presupuesto(p["id"])

        iva = self.app.config_model.obtener_float("iva_porcentaje", 21)
        facturacion *= (1 + iva / 100)

        clientes = self.app.cliente_model.listar()

        return {
            "pendientes": pendientes,
            "aceptados_mes": aceptados_mes,
            "facturacion": facturacion,
            "total_clientes": len(clientes),
        }
