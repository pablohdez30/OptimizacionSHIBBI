import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime
from app.ui.scrollable_dropdown import ScrollableComboBox
from app.database.models import FacturaModel


class FacturaEditorView(ctk.CTkFrame):
    """Edit an invoice: lines, adelanto, client, export."""

    def __init__(self, parent, app, factura_id):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self.factura_id = factura_id
        self.factura_model = FacturaModel(app.db)
        self.line_rows = []
        self._cached_iva_pct = self.app.config_model.obtener_float("iva_porcentaje", 21)
        self._refresh_timer = None
        self._build_ui()
        self._cargar_factura()
        self._start_refresh()

    def _start_refresh(self):
        """Lightweight periodic refresh to keep CTkEntry canvases updating."""
        try:
            self.scroll.update_idletasks()
        except Exception:
            pass
        self._refresh_timer = self.after(50, self._start_refresh)

    def destroy(self):
        if self._refresh_timer:
            self.after_cancel(self._refresh_timer)
        super().destroy()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        self.title_label = ctk.CTkLabel(
            header, text="Factura",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.app.COLOR_TEXT)
        self.title_label.pack(side="left", padx=30, pady=15)

        btn_frame = ctk.CTkFrame(header, fg_color="transparent")
        btn_frame.pack(side="right", padx=20)

        ctk.CTkButton(btn_frame, text="Volver", width=80,
                      fg_color="#6c757d", hover_color="#495057",
                      command=lambda: self.app._show_view("facturas")).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="Guardar", width=100,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_con_mensaje).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="Exportar Factura", width=150,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._exportar).pack(side="left", padx=5)

        # Scrollable content
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        self.scroll.grid_columnconfigure(0, weight=1)

        # --- Info card ---
        info_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        info_card.pack(fill="x", pady=(0, 10))
        info_inner = ctk.CTkFrame(info_card, fg_color="transparent")
        info_inner.pack(fill="x", padx=20, pady=15)

        # Row 1: Client + Nº + Fecha
        row1 = ctk.CTkFrame(info_inner, fg_color="transparent")
        row1.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(row1, text="Cliente:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")

        clientes = self.app.cliente_model.listar()
        self.cliente_names = {c["nombre"]: c["id"] for c in clientes}
        self._all_client_values = sorted(self.cliente_names.keys())

        self.cliente_combo = ScrollableComboBox(row1, values=self._all_client_values, width=350,
                                                     height=34,
                                                     placeholder_text="Escribe para buscar...")
        self.cliente_combo.pack(side="left", padx=(10, 15))

        ctk.CTkLabel(row1, text="Nº:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.numero_entry = ctk.CTkEntry(row1, width=100, height=30)
        self.numero_entry.pack(side="left", padx=10)

        ctk.CTkLabel(row1, text="Fecha:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(20, 0))
        self.fecha_entry = ctk.CTkEntry(row1, width=110, height=30)
        self.fecha_entry.pack(side="left", padx=10)

        # Row 2: Proyecto
        row2 = ctk.CTkFrame(info_inner, fg_color="transparent")
        row2.pack(fill="x", pady=(0, 5))
        ctk.CTkLabel(row2, text="Proyecto:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.proyecto_entry = ctk.CTkEntry(row2, width=400, height=30,
                                            placeholder_text="Ej: Reforma cocina...")
        self.proyecto_entry.pack(side="left", padx=(10, 20))

        # --- Lines table ---
        lines_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        lines_card.pack(fill="x", pady=(0, 10))

        lines_header = ctk.CTkFrame(lines_card, fg_color="transparent")
        lines_header.pack(fill="x", padx=15, pady=(12, 5))
        ctk.CTkLabel(lines_header, text="Lineas de factura",
                     font=ctk.CTkFont(size=16, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")

        # Table header
        th = ctk.CTkFrame(lines_card, fg_color="#f0f2f5", corner_radius=4)
        th.pack(fill="x", padx=15, pady=(5, 3))
        for text, w in [("Concepto", 250), ("Unidades", 80), ("PX Unitario", 100),
                        ("Total", 100), ("", 30)]:
            ctk.CTkLabel(th, text=text, width=w, font=ctk.CTkFont(size=11, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT, anchor="w").pack(side="left", padx=3, pady=5)

        self.lines_container = ctk.CTkFrame(lines_card, fg_color="transparent")
        self.lines_container.pack(fill="x", padx=15)

        # Buttons
        btn_row = ctk.CTkFrame(lines_card, fg_color="transparent")
        btn_row.pack(fill="x", padx=15, pady=(5, 12))
        ctk.CTkButton(btn_row, text="+ Añadir línea", width=130, height=32,
                      font=ctk.CTkFont(size=12),
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=lambda: self._add_line()).pack(side="left", padx=5)
        ctk.CTkButton(btn_row, text="+ Añadir Porte", width=130, height=32,
                      font=ctk.CTkFont(size=12),
                      fg_color="#6c757d", hover_color="#495057",
                      command=lambda: self._add_line(es_porte=True)).pack(side="left", padx=5)

        # --- Adelanto section ---
        adelanto_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        adelanto_card.pack(fill="x", pady=(0, 10))
        adelanto_inner = ctk.CTkFrame(adelanto_card, fg_color="transparent")
        adelanto_inner.pack(fill="x", padx=20, pady=15)

        self.adelanto_var = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(adelanto_inner, text="Incluir adelanto",
                        variable=self.adelanto_var,
                        font=ctk.CTkFont(size=13, weight="bold"),
                        command=self._update_summary).pack(side="left")

        ctk.CTkLabel(adelanto_inner, text="Descripción:",
                     font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(20, 5))
        self.adelanto_desc_entry = ctk.CTkEntry(adelanto_inner, width=200, height=30,
                                                 placeholder_text="Adelanto 50%")
        self.adelanto_desc_entry.pack(side="left", padx=5)

        ctk.CTkLabel(adelanto_inner, text="Importe:",
                     font=ctk.CTkFont(size=12),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(15, 5))
        self.adelanto_importe_entry = ctk.CTkEntry(adelanto_inner, width=100, height=30)
        self.adelanto_importe_entry.pack(side="left", padx=5)
        self.adelanto_importe_entry.insert(0, "0")
        self.adelanto_importe_entry.bind("<FocusOut>", lambda e: self._update_summary())

        # --- Summary ---
        self.summary_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.summary_card.pack(fill="x", pady=(0, 10))
        self._build_summary()

    def _build_summary(self):
        inner = ctk.CTkFrame(self.summary_card, fg_color="transparent")
        inner.pack(fill="x", padx=25, pady=15)

        summary = ctk.CTkFrame(inner, fg_color="transparent")
        summary.pack(side="right")

        iva_pct = self._cached_iva_pct

        r1 = ctk.CTkFrame(summary, fg_color="transparent")
        r1.pack(fill="x", pady=2)
        ctk.CTkLabel(r1, text="Base imponible:", font=ctk.CTkFont(size=14), width=150,
                     text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
        self._lbl_base = ctk.CTkLabel(r1, text="0,00€", font=ctk.CTkFont(size=14),
                                       width=120, text_color=self.app.COLOR_TEXT, anchor="e")
        self._lbl_base.pack(side="left", padx=(10, 0))

        r2 = ctk.CTkFrame(summary, fg_color="transparent")
        r2.pack(fill="x", pady=2)
        ctk.CTkLabel(r2, text=f"IVA {iva_pct:.0f}%:", font=ctk.CTkFont(size=14), width=150,
                     text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
        self._lbl_iva = ctk.CTkLabel(r2, text="0,00€", font=ctk.CTkFont(size=14),
                                      width=120, text_color=self.app.COLOR_TEXT, anchor="e")
        self._lbl_iva.pack(side="left", padx=(10, 0))

        r3 = ctk.CTkFrame(summary, fg_color="transparent")
        r3.pack(fill="x", pady=2)
        ctk.CTkLabel(r3, text="TOTAL:", font=ctk.CTkFont(size=16, weight="bold"), width=150,
                     text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
        self._lbl_total = ctk.CTkLabel(r3, text="0,00€", font=ctk.CTkFont(size=16, weight="bold"),
                                        width=120, text_color=self.app.COLOR_ACCENT, anchor="e")
        self._lbl_total.pack(side="left", padx=(10, 0))

    def _update_summary(self):
        total_base = sum(lr.get_total() for lr in self.line_rows)
        # Subtract adelanto
        if self.adelanto_var.get():
            try:
                adelanto = float(self.adelanto_importe_entry.get().replace(",", "."))
            except ValueError:
                adelanto = 0
            total_base -= adelanto

        iva_pct = self._cached_iva_pct
        iva = total_base * iva_pct / 100
        total = total_base + iva

        self._lbl_base.configure(text=f"{total_base:,.2f}€")
        self._lbl_iva.configure(text=f"{iva:,.2f}€")
        self._lbl_total.configure(text=f"{total:,.2f}€")

    def _add_line(self, data=None, es_porte=False):
        lr = FacturaLineRow(self.lines_container, self.app, self, data, es_porte)
        lr.pack(fill="x", pady=1)
        self.line_rows.append(lr)

    def _remove_line(self, lr):
        if lr in self.line_rows:
            self.line_rows.remove(lr)
            lr.destroy()
            self._update_summary()

    def _cargar_factura(self):
        factura = self.factura_model.obtener(self.factura_id)
        if not factura:
            return

        self.title_label.configure(text=f"Factura {factura['numero_factura']}")
        self.numero_entry.delete(0, "end")
        self.numero_entry.insert(0, factura["numero_factura"])

        self.fecha_entry.delete(0, "end")
        try:
            self.fecha_entry.insert(0, datetime.strptime(factura["fecha"], "%Y-%m-%d").strftime("%d/%m/%Y"))
        except (ValueError, TypeError):
            self.fecha_entry.insert(0, factura["fecha"] or "")

        self.proyecto_entry.delete(0, "end")
        self.proyecto_entry.insert(0, factura["proyecto"] or "")

        if factura["cliente_nombre"] in self.cliente_names:
            self.cliente_combo.set(factura["cliente_nombre"])

        # Lines
        lineas = self.factura_model.obtener_lineas(self.factura_id)
        for linea in lineas:
            self._add_line(data={
                "concepto": linea["concepto"],
                "descripcion": linea["descripcion"] or "",
                "unidades": linea["unidades"],
                "precio_unitario": linea["precio_unitario"],
                "es_porte": linea["es_porte"],
            }, es_porte=bool(linea["es_porte"]))

        # Adelanto
        adelanto = factura["adelanto_importe"] or 0
        if adelanto > 0:
            self.adelanto_var.set(True)
            self.adelanto_desc_entry.delete(0, "end")
            self.adelanto_desc_entry.insert(0, factura["adelanto_descripcion"] or "Adelanto 50%")
            self.adelanto_importe_entry.delete(0, "end")
            self.adelanto_importe_entry.insert(0, str(adelanto))

        self._update_summary()

    def _guardar(self):
        cliente_nombre = self.cliente_combo.get()
        cliente_id = self.cliente_names.get(cliente_nombre)
        if not cliente_id:
            messagebox.showwarning("Aviso", "Selecciona un cliente válido.")
            return None

        numero = self.numero_entry.get().strip()
        proyecto = self.proyecto_entry.get().strip()
        fecha_str = self.fecha_entry.get().strip()

        # Parse date
        try:
            fecha = datetime.strptime(fecha_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        except (ValueError, TypeError):
            fecha = datetime.now().strftime("%Y-%m-%d")

        # Adelanto
        adelanto_desc = ""
        adelanto_importe = 0
        if self.adelanto_var.get():
            adelanto_desc = self.adelanto_desc_entry.get().strip() or "Adelanto 50%"
            try:
                adelanto_importe = float(self.adelanto_importe_entry.get().replace(",", "."))
            except ValueError:
                adelanto_importe = 0

        # Update factura
        self.factura_model.actualizar(
            self.factura_id,
            numero_factura=numero,
            cliente_id=cliente_id,
            proyecto=proyecto,
            fecha=fecha,
            adelanto_descripcion=adelanto_desc,
            adelanto_importe=adelanto_importe,
        )

        # Delete old lines and re-create
        old_lineas = self.factura_model.obtener_lineas(self.factura_id)
        for ol in old_lineas:
            self.factura_model.eliminar_linea(ol["id"])

        for i, lr in enumerate(self.line_rows):
            data = lr.get_data()
            self.factura_model.agregar_linea(
                self.factura_id,
                concepto=data["concepto"] or f"Linea {i+1}",
                descripcion=data.get("descripcion", ""),
                unidades=data["unidades"],
                precio_unitario=data["precio_unitario"],
                es_porte=data["es_porte"],
                orden=i,
            )

        self.title_label.configure(text=f"Factura {numero}")
        return self.factura_id

    def _guardar_con_mensaje(self):
        if self._guardar():
            messagebox.showinfo("Guardado", "Factura guardada correctamente.")

    def _exportar(self):
        fid = self._guardar()
        if not fid:
            return
        from app.utils.factura_generator import generar_factura_excel, generar_factura_pdf

        paths = []
        errors = []

        for name, func in [("Excel factura", generar_factura_excel),
                            ("PDF factura", generar_factura_pdf)]:
            try:
                path = func(self.app, fid)
                if path:
                    paths.append(path)
            except PermissionError:
                errors.append(f"{name}: archivo abierto, ciérralo primero")
            except Exception as e:
                errors.append(f"{name}: {str(e)}")

        msg = ""
        if paths:
            msg += "Archivos generados:\n" + "\n".join(f"  {p}" for p in paths)
        if errors:
            msg += "\n\nErrores:\n" + "\n".join(f"  {e}" for e in errors)

        if errors:
            messagebox.showwarning("Exportación parcial", msg)
        elif paths:
            messagebox.showinfo("Factura exportada", msg)


class FacturaLineRow(ctk.CTkFrame):
    """A single line in the factura editor."""

    def __init__(self, parent, app, editor, data=None, es_porte=False):
        super().__init__(parent, fg_color="transparent", height=38)
        self.app = app
        self.editor = editor
        self._es_porte = es_porte

        # Concepto
        concepto_text = ""
        if data:
            concepto_text = data.get("concepto", "")
        elif es_porte:
            concepto_text = "Porte"

        self.concepto_entry = ctk.CTkEntry(self, width=250, height=28,
                                            font=ctk.CTkFont(size=12),
                                            placeholder_text="Concepto...")
        self.concepto_entry.pack(side="left", padx=3)
        if concepto_text:
            self.concepto_entry.insert(0, concepto_text)

        # Unidades
        self.unidades_entry = ctk.CTkEntry(self, width=80, height=28,
                                            font=ctk.CTkFont(size=12))
        self.unidades_entry.pack(side="left", padx=3)
        self.unidades_entry.insert(0, str(data.get("unidades", 1) if data else 1))

        # PX Unitario
        self.precio_entry = ctk.CTkEntry(self, width=100, height=28,
                                          font=ctk.CTkFont(size=12))
        self.precio_entry.pack(side="left", padx=3)
        self.precio_entry.insert(0, str(data.get("precio_unitario", 0) if data else 0))

        # Total label
        self.total_label = ctk.CTkLabel(self, text="0.00€", width=100,
                                         font=ctk.CTkFont(size=12),
                                         text_color=app.COLOR_TEXT, anchor="e")
        self.total_label.pack(side="left", padx=3)

        # Delete button
        ctk.CTkButton(self, text="x", width=26, height=26,
                      fg_color="#dc3545", hover_color="#c1121f",
                      font=ctk.CTkFont(size=11),
                      command=lambda: editor._remove_line(self)).pack(side="left", padx=3)

        # Bindings
        self.unidades_entry.bind("<FocusOut>", lambda e: self._recalc())
        self.precio_entry.bind("<FocusOut>", lambda e: self._recalc())
        self.unidades_entry.bind("<Return>", lambda e: self._recalc())
        self.precio_entry.bind("<Return>", lambda e: self._recalc())

        self._update_total()

    def _recalc(self):
        self._update_total()
        self.editor._update_summary()

    def _update_total(self):
        self.total_label.configure(text=f"{self.get_total():,.2f}€")

    def get_total(self):
        try:
            u = float(self.unidades_entry.get().replace(",", "."))
            p = float(self.precio_entry.get().replace(",", "."))
            return u * p
        except ValueError:
            return 0

    def get_data(self):
        try:
            u = float(self.unidades_entry.get().replace(",", "."))
        except ValueError:
            u = 1
        try:
            p = float(self.precio_entry.get().replace(",", "."))
        except ValueError:
            p = 0
        return {
            "concepto": self.concepto_entry.get().strip(),
            "unidades": u,
            "precio_unitario": p,
            "es_porte": 1 if self._es_porte else 0,
        }
