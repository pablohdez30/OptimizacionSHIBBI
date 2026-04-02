import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime, timedelta
import calendar


class CalendarioView(ctk.CTkFrame):
    """Full-screen monthly production calendar."""

    DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
             "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        now = datetime.now()
        self._year = now.year
        self._month = now.month
        self._day_frames = {}
        self._build_ui()
        self._render_month()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header with navigation
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        ctk.CTkButton(header, text="◀", width=40, height=36,
                      fg_color="#6c757d", hover_color="#495057",
                      font=ctk.CTkFont(size=18),
                      command=self._prev_month).pack(side="left", padx=(30, 5), pady=15)

        self.month_label = ctk.CTkLabel(header, text="",
                                         font=ctk.CTkFont(size=24, weight="bold"),
                                         text_color=self.app.COLOR_TEXT)
        self.month_label.pack(side="left", padx=15, pady=15)

        ctk.CTkButton(header, text="▶", width=40, height=36,
                      fg_color="#6c757d", hover_color="#495057",
                      font=ctk.CTkFont(size=18),
                      command=self._next_month).pack(side="left", padx=5, pady=15)

        ctk.CTkButton(header, text="Hoy", width=70, height=32,
                      fg_color=self.app.COLOR_ACCENT, hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._go_today).pack(side="left", padx=20, pady=15)

        ctk.CTkButton(header, text="+ Nuevo Evento", width=140, height=32,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._add_event_dialog).pack(side="right", padx=30, pady=15)

        # Calendar grid - single frame for headers + days (perfect alignment)
        self.cal_frame = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.cal_frame.grid(row=1, column=0, sticky="nsew", padx=15, pady=(10, 15))
        for i in range(7):
            self.cal_frame.grid_columnconfigure(i, weight=1, uniform="day")
        # Row 0 = headers, rows 1-6 = weeks (uniform = all same height)
        self.cal_frame.grid_rowconfigure(0, weight=0)
        for i in range(1, 7):
            self.cal_frame.grid_rowconfigure(i, weight=1, uniform="week")

        # Day name headers (row 0 of the grid)
        for i, day_name in enumerate(self.DIAS):
            color = self.app.COLOR_TEXT_LIGHT if i < 5 else self.app.COLOR_ACCENT
            lbl = ctk.CTkLabel(self.cal_frame, text=day_name,
                               font=ctk.CTkFont(size=14, weight="bold"),
                               text_color=color, height=30)
            lbl.grid(row=0, column=i, sticky="ew", padx=3, pady=(10, 5))

    def _render_month(self):
        self.month_label.configure(text=f"{self.MESES[self._month]} {self._year}")

        # Clear old day cells (keep header labels in row 0)
        for w in list(self.cal_frame.winfo_children()):
            info = w.grid_info()
            if info and int(info.get("row", 0)) >= 1:
                w.destroy()
        self._day_frames = {}

        # Get events for this month
        eventos = self.app.calendario_model.obtener_eventos_mes(self._year, self._month)
        eventos_by_day = {}
        for ev in eventos:
            day = ev["fecha"]
            if day not in eventos_by_day:
                eventos_by_day[day] = []
            eventos_by_day[day].append(ev)

        # Calendar math
        cal = calendar.Calendar(firstweekday=0)
        month_days = cal.monthdayscalendar(self._year, self._month)
        today = datetime.now().strftime("%Y-%m-%d")

        for row_idx, week in enumerate(month_days):
            grid_row = row_idx + 1  # +1 because row 0 is headers
            for col_idx, day in enumerate(week):
                if day == 0:
                    empty = ctk.CTkFrame(self.cal_frame, fg_color="#fafafa", corner_radius=6)
                    empty.grid(row=grid_row, column=col_idx, sticky="nsew", padx=3, pady=3)
                    continue

                fecha_str = f"{self._year}-{self._month:02d}-{day:02d}"
                is_today = fecha_str == today
                is_weekend = col_idx >= 5

                # Background: today=blue tint, weekend=warm gray, normal=white
                if is_today:
                    bg = "#dbeef8"
                    border_color = "#0077b6"
                elif is_weekend:
                    bg = "#f5f3f0"
                else:
                    bg = "#ffffff"

                cell = ctk.CTkFrame(self.cal_frame, fg_color=bg, corner_radius=6,
                                     border_width=2 if is_today else 1,
                                     border_color=border_color if is_today else "#e8e8e8",
                                     cursor="hand2")
                cell.grid(row=grid_row, column=col_idx, sticky="nsew", padx=3, pady=3)
                cell.bind("<Button-1>", lambda e, f=fecha_str: self._on_day_click(f))

                # Day number - bigger and bolder for today
                if is_today:
                    day_color = "#ffffff"
                    # Circle behind the number
                    circle = ctk.CTkFrame(cell, fg_color="#0077b6", corner_radius=15,
                                           width=30, height=30)
                    circle.pack(anchor="nw", padx=5, pady=(5, 0))
                    circle.pack_propagate(False)
                    lbl = ctk.CTkLabel(circle, text=str(day),
                                        font=ctk.CTkFont(size=14, weight="bold"),
                                        text_color=day_color)
                    lbl.pack(expand=True)
                    lbl.bind("<Button-1>", lambda e, f=fecha_str: self._on_day_click(f))
                    circle.bind("<Button-1>", lambda e, f=fecha_str: self._on_day_click(f))
                else:
                    day_color = "#aaa" if is_weekend else self.app.COLOR_TEXT
                    lbl = ctk.CTkLabel(cell, text=str(day),
                                        font=ctk.CTkFont(size=13, weight="bold"),
                                        text_color=day_color, anchor="nw")
                    lbl.pack(anchor="nw", padx=6, pady=(4, 0))
                    lbl.bind("<Button-1>", lambda e, f=fecha_str: self._on_day_click(f))

                # Events for this day
                day_events = eventos_by_day.get(fecha_str, [])
                for ev in day_events[:3]:  # Max 3 visible
                    ev_color = ev["color"] or "#0077b6"
                    ev_frame = ctk.CTkFrame(cell, fg_color=ev_color, corner_radius=4, height=20)
                    ev_frame.pack(fill="x", padx=4, pady=1)
                    ev_frame.pack_propagate(False)
                    ev_lbl = ctk.CTkLabel(ev_frame, text=ev["titulo"][:25],
                                           font=ctk.CTkFont(size=10),
                                           text_color="#ffffff", anchor="w")
                    ev_lbl.pack(fill="x", padx=4)
                    ev_frame.bind("<Button-1>", lambda e, eid=ev["id"]: self._on_event_click(eid))
                    ev_lbl.bind("<Button-1>", lambda e, eid=ev["id"]: self._on_event_click(eid))

                if len(day_events) > 3:
                    ctk.CTkLabel(cell, text=f"+{len(day_events)-3} más",
                                 font=ctk.CTkFont(size=9),
                                 text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w", padx=6)

                self._day_frames[fecha_str] = cell

    def _prev_month(self):
        if self._month == 1:
            self._month = 12
            self._year -= 1
        else:
            self._month -= 1
        self._render_month()

    def _next_month(self):
        if self._month == 12:
            self._month = 1
            self._year += 1
        else:
            self._month += 1
        self._render_month()

    def _go_today(self):
        now = datetime.now()
        self._year = now.year
        self._month = now.month
        self._render_month()

    def _on_day_click(self, fecha):
        """Show events for this day and offer to add new."""
        eventos = self.app.calendario_model.obtener_eventos_dia(fecha)

        dialog = ctk.CTkToplevel(self)
        dialog.title(f"Eventos - {fecha}")
        dialog.geometry("500x400")
        dialog.transient(self.winfo_toplevel())
        dialog.grab_set()

        ctk.CTkLabel(dialog, text=fecha, font=ctk.CTkFont(size=20, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(padx=20, pady=(15, 5))

        # Existing events
        scroll = ctk.CTkScrollableFrame(dialog, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=15, pady=5)

        if not eventos:
            ctk.CTkLabel(scroll, text="Sin eventos este día",
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         font=ctk.CTkFont(size=13)).pack(pady=20)
        else:
            for ev in eventos:
                ev_frame = ctk.CTkFrame(scroll, fg_color="#f8f9fa", corner_radius=8)
                ev_frame.pack(fill="x", pady=3)
                color_bar = ctk.CTkFrame(ev_frame, width=4, fg_color=ev["color"] or "#0077b6",
                                          corner_radius=2)
                color_bar.pack(side="left", fill="y", padx=(8, 0), pady=8)
                info = ctk.CTkFrame(ev_frame, fg_color="transparent")
                info.pack(side="left", fill="x", expand=True, padx=10, pady=8)
                ctk.CTkLabel(info, text=ev["titulo"],
                             font=ctk.CTkFont(size=13, weight="bold"),
                             text_color=self.app.COLOR_TEXT).pack(anchor="w")
                if ev["descripcion"]:
                    ctk.CTkLabel(info, text=ev["descripcion"],
                                 font=ctk.CTkFont(size=11),
                                 text_color=self.app.COLOR_TEXT_LIGHT).pack(anchor="w")

                # Toggle completed (red) button
                is_red = (ev["color"] == "#dc3545")
                toggle_text = "Reabrir" if is_red else "Completado"
                toggle_color = "#6c757d" if is_red else "#dc3545"
                ctk.CTkButton(ev_frame, text=toggle_text, width=80, height=24,
                              font=ctk.CTkFont(size=10),
                              fg_color=toggle_color,
                              command=lambda eid=ev["id"], red=is_red, d=dialog, f=fecha:
                                  self._toggle_completado(eid, red, d, f)
                              ).pack(side="right", padx=(0, 4), pady=8)

                ctk.CTkButton(ev_frame, text="x", width=24, height=24,
                              fg_color="#dc3545", hover_color="#c1121f",
                              font=ctk.CTkFont(size=10),
                              command=lambda eid=ev["id"], d=dialog, f=fecha: self._delete_event(eid, d, f)
                              ).pack(side="right", padx=8, pady=8)

        # Add event form
        add_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        add_frame.pack(fill="x", padx=15, pady=(5, 15))

        titulo_entry = ctk.CTkEntry(add_frame, placeholder_text="Título del evento...",
                                     width=250, height=32)
        titulo_entry.pack(side="left", padx=(0, 8))

        desc_entry = ctk.CTkEntry(add_frame, placeholder_text="Descripción...",
                                   width=150, height=32)
        desc_entry.pack(side="left", padx=(0, 8))

        def add():
            t = titulo_entry.get().strip()
            if t:
                self.app.calendario_model.crear_evento(fecha, t, desc_entry.get().strip())
                dialog.destroy()
                self._render_month()

        ctk.CTkButton(add_frame, text="Añadir", width=80, height=32,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=add).pack(side="left")

    def _on_event_click(self, evento_id):
        """Show event detail (could expand later)."""
        pass  # For now, day click handles everything

    def _toggle_completado(self, evento_id, is_currently_red, dialog, fecha):
        """Toggle event between completed (red) and active (green)."""
        new_color = "#2d6a4f" if is_currently_red else "#dc3545"
        self.app.calendario_model.actualizar_evento(evento_id, color=new_color)
        dialog.destroy()
        self._render_month()
        self._on_day_click(fecha)

    def _delete_event(self, evento_id, dialog, fecha):
        self.app.calendario_model.eliminar_evento(evento_id)
        dialog.destroy()
        self._render_month()
        # Reopen day dialog
        self._on_day_click(fecha)

    def _add_event_dialog(self):
        """Quick add event for today."""
        today = datetime.now().strftime("%Y-%m-%d")
        self._on_day_click(today)
