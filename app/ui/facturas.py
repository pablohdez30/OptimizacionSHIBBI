import customtkinter as ctk
from tkinter import messagebox
from app.database.models import FacturaModel, PresupuestoModel


class FacturasView(ctk.CTkFrame):
    """Invoice list view with creation, editing, and export."""

    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self.factura_model = FacturaModel(app.db)
        self.presupuesto_model = PresupuestoModel(app.db)
        self._build_ui()
        self._cargar()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=0, height=70)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)

        ctk.CTkLabel(header, text="Facturas",
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=30, pady=15)

        btn_frame = ctk.CTkFrame(header, fg_color="transparent")
        btn_frame.pack(side="right", padx=20)

        ctk.CTkButton(btn_frame, text="Desde Presupuesto", width=160,
                      fg_color="#0077b6", hover_color="#005f8a",
                      command=self._desde_presupuesto).pack(side="left", padx=5)

        ctk.CTkButton(btn_frame, text="+ Nueva Factura", width=150,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._nueva_factura).pack(side="left", padx=5)

        # Table
        table_frame = ctk.CTkFrame(self, fg_color=self.app.COLOR_CARD, corner_radius=12)
        table_frame.grid(row=1, column=0, sticky="nsew", padx=25, pady=15)

        # Table header
        th = ctk.CTkFrame(table_frame, fg_color="#f8f9fa", corner_radius=0)
        th.pack(fill="x", padx=10, pady=(10, 2))
        cols = [("Nº", 80), ("Cliente", 170), ("Proyecto", 140), ("Fecha", 90),
                ("Total (IVA inc.)", 120), ("Acciones", 280)]
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

        facturas = self.factura_model.listar()
        iva_pct = self.app.config_model.obtener_float("iva_porcentaje", 21)

        if not facturas:
            ctk.CTkLabel(self.list_scroll, text="No hay facturas.",
                         text_color=self.app.COLOR_TEXT_LIGHT,
                         font=ctk.CTkFont(size=14)).pack(pady=40)
            return

        for f in facturas:
            row = ctk.CTkFrame(self.list_scroll, fg_color="transparent", height=42)
            row.pack(fill="x", pady=1)

            total_base = self.factura_model.calcular_total(f["id"])
            # Subtract adelanto if present
            adelanto = f["adelanto_importe"] or 0
            total_base -= adelanto
            total_iva = total_base * (1 + iva_pct / 100)

            ctk.CTkLabel(row, text=f["numero_factura"], width=80,
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=6)
            ctk.CTkLabel(row, text=f["cliente_nombre"], width=170,
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=6)
            ctk.CTkLabel(row, text=f["proyecto"] or "", width=140,
                         font=ctk.CTkFont(size=12),
                         text_color=self.app.COLOR_TEXT_LIGHT, anchor="w").pack(side="left", padx=6)
            ctk.CTkLabel(row, text=f["fecha"], width=90,
                         font=ctk.CTkFont(size=13),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=6)
            ctk.CTkLabel(row, text=f"{total_iva:,.2f}€", width=120,
                         font=ctk.CTkFont(size=13, weight="bold"),
                         text_color=self.app.COLOR_TEXT, anchor="w").pack(side="left", padx=6)

            # Action buttons
            actions = ctk.CTkFrame(row, fg_color="transparent")
            actions.pack(side="left", padx=8)

            ctk.CTkButton(actions, text="Editar", width=55, height=26,
                          font=ctk.CTkFont(size=11),
                          fg_color="#0077b6", hover_color="#005f8a",
                          command=lambda fid=f["id"]: self.app.show_factura_editor(fid)
                          ).pack(side="left", padx=2)

            ctk.CTkButton(actions, text="Exportar", width=65, height=26,
                          font=ctk.CTkFont(size=11),
                          fg_color=self.app.COLOR_ACCENT,
                          hover_color=self.app.COLOR_ACCENT_HOVER,
                          command=lambda fid=f["id"]: self._exportar(fid)
                          ).pack(side="left", padx=2)

            ctk.CTkButton(actions, text="Eliminar", width=60, height=26,
                          font=ctk.CTkFont(size=11),
                          fg_color=self.app.COLOR_DANGER, hover_color="#c1121f",
                          command=lambda fid=f["id"]: self._eliminar(fid)
                          ).pack(side="left", padx=2)

    def _nueva_factura(self):
        """Create a new blank factura and open editor."""
        clientes = self.app.cliente_model.listar()
        if not clientes:
            messagebox.showwarning("Aviso", "Primero crea un cliente.")
            return
        factura_id = self.factura_model.crear(cliente_id=clientes[0]["id"])
        self.app.show_factura_editor(factura_id)

    def _desde_presupuesto(self):
        """Open dialog to select a presupuesto and create a factura from it."""
        presupuestos = self.presupuesto_model.listar()
        if not presupuestos:
            messagebox.showwarning("Aviso", "No hay presupuestos disponibles.")
            return

        dialog = ctk.CTkToplevel(self)
        dialog.title("Crear factura desde presupuesto")
        dialog.geometry("500x400")
        dialog.grab_set()
        dialog.transient(self.winfo_toplevel())

        ctk.CTkLabel(dialog, text="Selecciona un presupuesto:",
                     font=ctk.CTkFont(size=14, weight="bold")).pack(padx=20, pady=(15, 5))

        scroll = ctk.CTkScrollableFrame(dialog, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=15, pady=5)

        for p in presupuestos:
            total = self.presupuesto_model.calcular_total_presupuesto(p["id"])
            text = f"{p['numero_presupuesto']} - {p['cliente_nombre']} - {p['proyecto'] or 'Sin proyecto'} ({total:,.2f}€)"
            ctk.CTkButton(scroll, text=text, anchor="w", height=35,
                          font=ctk.CTkFont(size=12),
                          fg_color="#f0f2f5", text_color="#1a1a2e",
                          hover_color="#d0d5dd",
                          command=lambda pid=p["id"], d=dialog: self._crear_desde_pres(pid, d)
                          ).pack(fill="x", pady=2)

        ctk.CTkButton(dialog, text="Cancelar", width=100,
                      fg_color="#6c757d", hover_color="#495057",
                      command=dialog.destroy).pack(pady=10)

    def _crear_desde_pres(self, presupuesto_id, dialog):
        dialog.destroy()
        try:
            factura_id = self.factura_model.crear_desde_presupuesto(presupuesto_id)
            if factura_id:
                messagebox.showinfo("Factura creada",
                                    "Factura creada correctamente desde presupuesto.")
                self.app.show_factura_editor(factura_id)
            else:
                messagebox.showerror("Error", "No se pudo crear la factura.")
        except Exception as e:
            messagebox.showerror("Error", f"Error creando factura: {e}")

    def _exportar(self, factura_id):
        from app.utils.factura_generator import generar_factura_excel, generar_factura_pdf

        paths = []
        errors = []

        for name, func in [("Excel factura", generar_factura_excel),
                            ("PDF factura", generar_factura_pdf)]:
            try:
                path = func(self.app, factura_id)
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

    def _eliminar(self, factura_id):
        if messagebox.askyesno("Confirmar", "¿Eliminar esta factura? Esta acción no se puede deshacer."):
            self.factura_model.eliminar(factura_id)
            self._cargar()
