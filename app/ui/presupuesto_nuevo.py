import customtkinter as ctk
from tkinter import messagebox, ttk
import tkinter as tk
from datetime import datetime
from app.ui.scrollable_dropdown import ScrollableComboBox


class NuevoPresupuestoView(ctk.CTkFrame):
    """Create/edit budget with cost breakdown per furniture item."""

    def __init__(self, parent, app, presupuesto_id=None):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self.presupuesto_id = presupuesto_id
        # True if this view was opened on an EXISTING presupuesto (loaded from DB)
        # Used to ask for confirmation before overwriting
        self._was_loaded_existing = bool(presupuesto_id)
        self.mueble_frames = []
        self._cached_iva_pct = self.app.config_model.obtener_float("iva_porcentaje", 21)
        self._refresh_timer = None
        self._build_ui()
        if presupuesto_id:
            self._cargar_presupuesto()
        # Periodic refresh: forces CTkEntry canvas widgets to repaint.
        # Without this, text typed in CTkEntry inside CTkScrollableFrame
        # doesn't appear until a window resize event on some Windows systems.
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
            header, text="Nuevo Presupuesto" if not self.presupuesto_id else "Editar Presupuesto",
            font=ctk.CTkFont(size=24, weight="bold"), text_color=self.app.COLOR_TEXT)
        self.title_label.pack(side="left", padx=30, pady=15)

        btn_frame = ctk.CTkFrame(header, fg_color="transparent")
        btn_frame.pack(side="right", padx=20)
        ctk.CTkButton(btn_frame, text="+ Nuevo", width=90,
                      fg_color="#6c757d", hover_color="#495057",
                      command=self._nuevo_presupuesto).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="Guardar", width=100,
                      fg_color=self.app.COLOR_SUCCESS, hover_color="#1b4332",
                      command=self._guardar_con_mensaje).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="Exportar Presupuesto", width=180,
                      fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._exportar_presupuesto).pack(side="left", padx=5)

        # Scrollable content
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        self.scroll.grid_columnconfigure(0, weight=1)

        # --- Client & budget info ---
        info_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        info_card.pack(fill="x", pady=(0, 10))
        info_inner = ctk.CTkFrame(info_card, fg_color="transparent")
        info_inner.pack(fill="x", padx=20, pady=15)
        info_inner.grid_columnconfigure(1, weight=1)

        LABEL_W = 110  # Fixed width for all labels to align inputs

        # Row 0: Client + Nº + Fecha
        ctk.CTkLabel(info_inner, text="Cliente:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT, width=LABEL_W, anchor="w"
                     ).grid(row=0, column=0, sticky="w", pady=(0, 5))

        clientes = self.app.cliente_model.listar()
        self.cliente_names = {c["nombre"]: c["id"] for c in clientes}
        self._all_client_values = sorted(self.cliente_names.keys())

        row0_right = ctk.CTkFrame(info_inner, fg_color="transparent")
        row0_right.grid(row=0, column=1, sticky="w", pady=(0, 5))

        self.cliente_combo = ScrollableComboBox(row0_right, values=self._all_client_values, width=350,
                                                     height=34,
                                                     placeholder_text="Escribe para buscar...")
        self.cliente_combo.pack(side="left")
        if self._all_client_values:
            self.cliente_combo.set(self._all_client_values[0])

        ctk.CTkButton(row0_right, text="+ Cliente", width=80, height=28,
                      fg_color="#6c757d", hover_color="#495057",
                      font=ctk.CTkFont(size=12),
                      command=self._quick_new_client).pack(side="left", padx=(5, 20))
        ctk.CTkLabel(row0_right, text="Nº:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.numero_entry = ctk.CTkEntry(row0_right, width=100, height=30,
                                          placeholder_text="(auto)")
        self.numero_entry.pack(side="left", padx=10)
        ctk.CTkLabel(row0_right, text="Fecha:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left", padx=(20, 0))
        self.fecha_entry = ctk.CTkEntry(row0_right, width=110, height=30)
        self.fecha_entry.pack(side="left", padx=10)
        self.fecha_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))

        # Row 1: Proyecto + Instalación
        ctk.CTkLabel(info_inner, text="Proyecto:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT, width=LABEL_W, anchor="w"
                     ).grid(row=1, column=0, sticky="w", pady=(0, 5))

        row1_right = ctk.CTkFrame(info_inner, fg_color="transparent")
        row1_right.grid(row=1, column=1, sticky="w", pady=(0, 5))
        self.proyecto_entry = ctk.CTkEntry(row1_right, width=300, height=30,
                                            placeholder_text="Ej: Reforma cocina, Salón principal...")
        self.proyecto_entry.pack(side="left", padx=(0, 20))
        ctk.CTkLabel(row1_right, text="Instalación:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.instalacion_var = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(row1_right, text="Incluida", variable=self.instalacion_var,
                        font=ctk.CTkFont(size=12)).pack(side="left", padx=10)

        # Row 2: Condiciones de pago
        ctk.CTkLabel(info_inner, text="Condiciones:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT, width=LABEL_W, anchor="w"
                     ).grid(row=2, column=0, sticky="w", pady=(0, 5))
        condiciones_opciones = [
            "50% adelanto - 50% antes de la entrega del trabajo.",
            "70% adelanto - 30% antes de la entrega del trabajo.",
            "100% adelanto.",
        ]
        self.condiciones_combo = ctk.CTkComboBox(info_inner, values=condiciones_opciones,
                                                   width=420, height=30, font=ctk.CTkFont(size=11))
        self.condiciones_combo.grid(row=2, column=1, sticky="w", pady=(0, 5))
        self.condiciones_combo.set(condiciones_opciones[0])

        # Row 3: Notas
        ctk.CTkLabel(info_inner, text="Notas internas:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT, width=LABEL_W, anchor="w"
                     ).grid(row=3, column=0, sticky="w", pady=(0, 3))
        self.notas_entry = ctk.CTkEntry(info_inner, width=500, height=30,
                                         placeholder_text="Notas internas...")
        self.notas_entry.grid(row=3, column=1, sticky="w", pady=(0, 3))

        # --- Furniture items ---
        self.muebles_container = ctk.CTkFrame(self.scroll, fg_color="transparent")
        self.muebles_container.pack(fill="x", pady=(0, 5))
        ctk.CTkButton(self.scroll, text="+ Añadir Mueble/Producto", height=40,
                      font=ctk.CTkFont(size=14), fg_color=self.app.COLOR_ACCENT,
                      hover_color=self.app.COLOR_ACCENT_HOVER,
                      command=self._add_mueble).pack(fill="x", pady=(0, 10))

        # --- Summary (labels created once, text updated) ---
        self.summary_card = ctk.CTkFrame(self.scroll, fg_color=self.app.COLOR_CARD, corner_radius=12)
        self.summary_card.pack(fill="x", pady=(0, 10))
        self._build_summary()
        if not self.presupuesto_id:
            self._add_mueble()

    def _build_summary(self):
        inner = ctk.CTkFrame(self.summary_card, fg_color="transparent")
        inner.pack(fill="x", padx=25, pady=15)
        self.install_label = ctk.CTkLabel(inner, text="Porte/Instalación NO incluido",
                                           font=ctk.CTkFont(size=12, slant="italic"),
                                           text_color=self.app.COLOR_TEXT_LIGHT)
        self.install_label.pack(side="left")
        summary = ctk.CTkFrame(inner, fg_color="transparent")
        summary.pack(side="right")
        iva_pct = self.app.config_model.obtener_float("iva_porcentaje", 21)

        # Row: Base imponible
        r1 = ctk.CTkFrame(summary, fg_color="transparent")
        r1.pack(fill="x", pady=2)
        ctk.CTkLabel(r1, text="Base imponible:", font=ctk.CTkFont(size=14), width=150,
                     text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
        self._lbl_base = ctk.CTkLabel(r1, text="0,00€", font=ctk.CTkFont(size=14),
                                       width=120, text_color=self.app.COLOR_TEXT, anchor="e")
        self._lbl_base.pack(side="left", padx=(10, 0))

        # Row: IVA
        r2 = ctk.CTkFrame(summary, fg_color="transparent")
        r2.pack(fill="x", pady=2)
        ctk.CTkLabel(r2, text=f"IVA {iva_pct:.0f}%:", font=ctk.CTkFont(size=14), width=150,
                     text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
        self._lbl_iva = ctk.CTkLabel(r2, text="0,00€", font=ctk.CTkFont(size=14),
                                      width=120, text_color=self.app.COLOR_TEXT, anchor="e")
        self._lbl_iva.pack(side="left", padx=(10, 0))

        # Row: TOTAL
        r3 = ctk.CTkFrame(summary, fg_color="transparent")
        r3.pack(fill="x", pady=2)
        ctk.CTkLabel(r3, text="TOTAL:", font=ctk.CTkFont(size=16, weight="bold"), width=150,
                     text_color=self.app.COLOR_TEXT, anchor="e").pack(side="left")
        self._lbl_total = ctk.CTkLabel(r3, text="0,00€", font=ctk.CTkFont(size=16, weight="bold"),
                                        width=120, text_color=self.app.COLOR_ACCENT, anchor="e")
        self._lbl_total.pack(side="left", padx=(10, 0))

    def _update_summary(self):
        total_base = sum(mf.get_precio_cliente() * mf.get_cantidad() for mf in self.mueble_frames)
        iva_pct = self._cached_iva_pct
        self._lbl_base.configure(text=f"{total_base:,.2f}€")
        self._lbl_iva.configure(text=f"{total_base * iva_pct / 100:,.2f}€")
        self._lbl_total.configure(text=f"{total_base * (1 + iva_pct / 100):,.2f}€")
        self.install_label.configure(
            text="" if self.instalacion_var.get() else "Porte/Instalación NO incluido")

    def _add_mueble(self, data=None):
        mueble = MuebleFrame(self.muebles_container, self.app, self, len(self.mueble_frames), data)
        mueble.pack(fill="x", pady=(0, 8))
        self.mueble_frames.append(mueble)

    def _remove_mueble(self, mf):
        if mf in self.mueble_frames:
            self.mueble_frames.remove(mf); mf.destroy(); self._update_summary()

    def _nuevo_presupuesto(self):
        self.presupuesto_id = None
        self._was_loaded_existing = False
        self.numero_entry.delete(0, "end")
        self.title_label.configure(text="Nuevo Presupuesto")
        for f in [self.proyecto_entry, self.notas_entry, self.fecha_entry]:
            f.delete(0, "end")
        self.fecha_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))
        self.instalacion_var.set(False)
        for mf in list(self.mueble_frames): mf.destroy()
        self.mueble_frames.clear()
        self._add_mueble()
        self._update_summary()

    def _quick_new_client(self):
        dialog = ctk.CTkInputDialog(text="Nombre del cliente:", title="Nuevo Cliente")
        nombre = dialog.get_input()
        if nombre and nombre.strip():
            self.app.cliente_model.crear(nombre.strip())
            clientes = self.app.cliente_model.listar()
            self.cliente_names = {c["nombre"]: c["id"] for c in clientes}
            self._all_client_values = sorted(self.cliente_names.keys())
            self.cliente_combo.configure(values=self._all_client_values)
            self.cliente_combo.set(nombre.strip())
            DetailRow._cached_cat_names = None

    def _guardar(self):
        # Force recalculation of all rows before saving
        for mf in self.mueble_frames:
            for dr in mf.detail_rows:
                dr._update_total()
            mf._recalculate()

        cliente_nombre = self.cliente_combo.get()
        cliente_id = self.cliente_names.get(cliente_nombre)
        if not cliente_id:
            messagebox.showwarning("Aviso", "Selecciona un cliente válido."); return None
        if not self.mueble_frames:
            messagebox.showwarning("Aviso", "Añade al menos un mueble/producto."); return None
        proyecto = self.proyecto_entry.get().strip()
        nuevo_numero = self.numero_entry.get().strip()
        if self.presupuesto_id:
            campos = dict(
                cliente_id=cliente_id, proyecto=proyecto,
                notas_internas=self.notas_entry.get().strip(),
                incluye_instalacion=1 if self.instalacion_var.get() else 0,
                condiciones_pago=self.condiciones_combo.get())
            # Allow changing the Nº if user edited it
            pres_actual = self.app.presupuesto_model.obtener(self.presupuesto_id)
            if nuevo_numero and pres_actual and nuevo_numero != pres_actual["numero_presupuesto"]:
                campos["numero_presupuesto"] = nuevo_numero
            try:
                self.app.presupuesto_model.actualizar(self.presupuesto_id, **campos)
            except Exception as e:
                messagebox.showerror("Error",
                    f"No se pudo actualizar el presupuesto.\n"
                    f"Puede que el Nº '{nuevo_numero}' ya exista.\n\n{e}")
                return None
            for ol in self.app.presupuesto_model.obtener_lineas(self.presupuesto_id):
                self.app.presupuesto_model.eliminar_linea(ol["id"])
            pres_id = self.presupuesto_id
        else:
            pres_id = self.app.presupuesto_model.crear(
                cliente_id, proyecto=proyecto, notas_internas=self.notas_entry.get().strip(),
                incluye_instalacion=self.instalacion_var.get(),
                condiciones_pago=self.condiciones_combo.get())
            self.presupuesto_id = pres_id
        prov_map = {p["nombre"]: p["id"] for p in self.app.proveedor_model.listar()}
        for i, mf in enumerate(self.mueble_frames):
            lid = self.app.presupuesto_model.agregar_linea(
                pres_id, nombre_producto=mf.nombre_entry.get().strip() or f"Producto {i+1}",
                descripcion=mf.desc_entry.get().strip(), cantidad=mf.get_cantidad(),
                precio_unitario_final=mf.get_precio_cliente(), margen_porcentaje=mf.get_margen(), orden=i)
            for det in mf.get_detalles():
                cat = self.app.categoria_model.obtener_por_nombre(det["categoria"])
                self.app.presupuesto_model.agregar_detalle_coste(
                    lid, prov_map.get(det["proveedor"]), cat["id"] if cat else None,
                    det["descripcion"], det["cantidad"], det["precio_unitario"], "")
        pres = self.app.presupuesto_model.obtener(pres_id)
        if pres:
            self.numero_entry.delete(0, "end")
            self.numero_entry.insert(0, pres["numero_presupuesto"])
            self.title_label.configure(text=f"Presupuesto {pres['numero_presupuesto']}")
        return pres_id

    def _confirmar_edicion_existente(self):
        """Ask for confirmation when modifying a presupuesto that was loaded
        from the database. Prevents accidentally overwriting an existing
        budget when the user meant to create a new one."""
        if not self._was_loaded_existing:
            return True
        return messagebox.askyesno(
            "Confirmar edición",
            "Estás editando un presupuesto que ya existía.\n\n"
            "¿Seguro que quieres guardar los cambios sobre él?\n"
            "(Si querías crear uno nuevo, pulsa 'No' y usa el botón '+ Nuevo')")

    def _guardar_con_mensaje(self):
        if not self._confirmar_edicion_existente():
            return
        if self._guardar():
            messagebox.showinfo("Guardado", "Presupuesto guardado correctamente.")

    def _cargar_presupuesto(self):
        pres = self.app.presupuesto_model.obtener(self.presupuesto_id)
        if not pres: return
        self.numero_entry.delete(0, "end")
        self.numero_entry.insert(0, pres["numero_presupuesto"])
        self.title_label.configure(text=f"Presupuesto {pres['numero_presupuesto']}")
        self.fecha_entry.delete(0, "end")
        try: self.fecha_entry.insert(0, datetime.strptime(pres["fecha"], "%Y-%m-%d").strftime("%d/%m/%Y"))
        except: self.fecha_entry.insert(0, pres["fecha"] or "")
        self.proyecto_entry.delete(0, "end"); self.proyecto_entry.insert(0, pres["proyecto"] or "")
        self.instalacion_var.set(bool(pres["incluye_instalacion"]))
        if pres["condiciones_pago"]:
            self.condiciones_combo.set(pres["condiciones_pago"])
        self.notas_entry.delete(0, "end"); self.notas_entry.insert(0, pres["notas_internas"] or "")
        if pres["cliente_nombre"] in self.cliente_names:
            self.cliente_combo.set(pres["cliente_nombre"])
        for linea in self.app.presupuesto_model.obtener_lineas(self.presupuesto_id):
            detalles = self.app.presupuesto_model.obtener_detalles_coste(linea["id"])
            self._add_mueble({
                "nombre": linea["nombre_producto"], "descripcion": linea["descripcion"],
                "cantidad": linea["cantidad"], "margen": linea["margen_porcentaje"],
                "detalles": [{"categoria": d["categoria_nombre"] or "", "proveedor": d["proveedor_nombre"] or "",
                              "descripcion": d["descripcion"] or "", "cantidad": d["cantidad"],
                              "precio_unitario": d["precio_unitario"]} for d in detalles]})
        self._update_summary()

    def _exportar_presupuesto(self):
        """Export all: Excel presupuesto (template) + PDF + Excel desglose."""
        if not self._confirmar_edicion_existente():
            return
        pid = self._guardar()
        if not pid:
            return
        from app.utils.pdf_generator import generar_pdf_presupuesto
        from app.utils.excel_template import generar_excel_plantilla
        from app.utils.excel_generator import generar_excel_presupuesto
        from app.utils.output_path import copiar_a_drive

        paths = []
        errors = []
        drive_warnings = []

        for name, func in [("Excel presupuesto", generar_excel_plantilla),
                            ("PDF presupuesto", generar_pdf_presupuesto),
                            ("Excel desglose", generar_excel_presupuesto)]:
            try:
                path = func(self.app, pid)
                if path:
                    paths.append(path)
                    # Copy to Google Drive
                    ok, err = copiar_a_drive(path, app=self.app)
                    if err and err not in drive_warnings:
                        drive_warnings.append(err)
            except PermissionError:
                errors.append(f"{name}: archivo abierto, ciérralo primero")
            except Exception as e:
                errors.append(f"{name}: {str(e)}")

        msg = ""
        if paths:
            msg += "Archivos generados:\n" + "\n".join(f"  {p}" for p in paths)
        if drive_warnings:
            msg += "\n\nAvisos Drive:\n" + "\n".join(f"  {w}" for w in drive_warnings)
        if errors:
            msg += "\n\nErrores:\n" + "\n".join(f"  {e}" for e in errors)

        if errors or drive_warnings:
            messagebox.showwarning("Exportación" + (" parcial" if errors else ""), msg)
        elif paths:
            messagebox.showinfo("Presupuesto exportado", msg)


class MuebleFrame(ctk.CTkFrame):
    def __init__(self, parent, app, view, index, data=None):
        super().__init__(parent, fg_color=app.COLOR_CARD, corner_radius=12)
        self.app = app; self.view = view; self.detail_rows = []
        self._build_ui(data)

    def _build_ui(self, data=None):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=15, pady=(12, 5))
        ctk.CTkLabel(header, text="Nombre:", font=ctk.CTkFont(size=13, weight="bold"),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.nombre_entry = ctk.CTkEntry(header, width=250, height=30,
                                          placeholder_text="Ej: Mesa Piramidal Óxido")
        self.nombre_entry.pack(side="left", padx=(8, 15))
        ctk.CTkLabel(header, text="Descripción:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.desc_entry = ctk.CTkEntry(header, width=250, height=30,
                                        placeholder_text="Ej: 140*140*45Hcm")
        self.desc_entry.pack(side="left", padx=(8, 15))
        ctk.CTkLabel(header, text="Cant:", font=ctk.CTkFont(size=13),
                     text_color=self.app.COLOR_TEXT).pack(side="left")
        self.cant_entry = ctk.CTkEntry(header, width=50, height=30)
        self.cant_entry.pack(side="left", padx=(5, 15)); self.cant_entry.insert(0, "1")
        # Global margin stored for saving to DB but hidden (per-line margins in DetailRow)
        self._margen_default = self.app.config_model.obtener("margen_default") or "100"
        ctk.CTkButton(header, text="X", width=30, height=30,
                      fg_color=self.app.COLOR_DANGER, hover_color="#c1121f",
                      command=lambda: self.view._remove_mueble(self)).pack(side="right")

        table = ctk.CTkFrame(self, fg_color="transparent")
        table.pack(fill="x", padx=15, pady=(5, 5))
        th = ctk.CTkFrame(table, fg_color="#f0f2f5", corner_radius=4)
        th.pack(fill="x", pady=(0, 3))
        for text, w in [("Categoría", 135), ("Proveedor", 135), ("Material", 250),
                        ("Cant.", 75), ("Precio Ud.", 95), ("Margen%", 65), ("Total", 90)]:
            ctk.CTkLabel(th, text=text, width=w, font=ctk.CTkFont(size=11, weight="bold"),
                         text_color=self.app.COLOR_TEXT_LIGHT, anchor="w").pack(side="left", padx=3, pady=5)
        self.rows_container = ctk.CTkFrame(table, fg_color="transparent")
        self.rows_container.pack(fill="x")
        ctk.CTkButton(table, text="+ Añadir línea", width=120, height=28,
                      font=ctk.CTkFont(size=12), fg_color="#6c757d", hover_color="#495057",
                      command=self._add_detail_row).pack(anchor="w", pady=(5, 0))

        tf = ctk.CTkFrame(self, fg_color="#f8f9fa", corner_radius=0)
        tf.pack(fill="x", padx=15, pady=(5, 12))
        self.coste_label = ctk.CTkLabel(tf, text="Coste: 0,00€", font=ctk.CTkFont(size=13),
                                         text_color=self.app.COLOR_TEXT)
        self.coste_label.pack(side="left", padx=15, pady=8)
        self.precio_label = ctk.CTkLabel(tf, text="Precio cliente: 0,00€",
                                          font=ctk.CTkFont(size=14, weight="bold"),
                                          text_color=self.app.COLOR_ACCENT)
        self.precio_label.pack(side="right", padx=15, pady=8)

        if data:
            self.nombre_entry.insert(0, data.get("nombre", ""))
            self.desc_entry.insert(0, data.get("descripcion", ""))
            self.cant_entry.delete(0, "end"); self.cant_entry.insert(0, str(data.get("cantidad", 1)))
            for det in data.get("detalles", []):
                self._add_detail_row(det)
        else:
            self._add_detail_row({"categoria": "Madera"})
            self._add_detail_row({"categoria": "Mano de Obra"})
            self._add_detail_row({"categoria": "Extras"})

    def _add_detail_row(self, data=None):
        row = DetailRow(self.rows_container, self.app, self, data)
        row.pack(fill="x", pady=3); self.detail_rows.append(row)

    def _remove_detail_row(self, row):
        if row in self.detail_rows:
            self.detail_rows.remove(row); row.destroy(); self._recalculate()

    def _recalculate(self):
        self.coste_label.configure(text=f"Coste: {self.get_coste_total():,.2f}€")
        self.precio_label.configure(text=f"Precio cliente: {self.get_precio_cliente():,.2f}€")
        self.view._update_summary()

    def get_coste_total(self): return sum(r.get_total() for r in self.detail_rows)
    def get_margen(self):
        try: return float(self._margen_default.replace(",", "."))
        except (ValueError, AttributeError): return 100
    def get_cantidad(self):
        try: return int(self.cant_entry.get())
        except ValueError: return 1
    def get_precio_cliente(self):
        """Calculate client price using each line's individual margin."""
        total = 0
        for row in self.detail_rows:
            coste = row.get_total()
            margen = row.get_margen()
            total += coste * (1 + margen / 100)
        return total
    def get_detalles(self):
        return [d for r in self.detail_rows for d in [r.get_data()]
                if d["precio_unitario"] > 0 or d["descripcion"]]


class DetailRow(ctk.CTkFrame):
    """Cost detail row. CTkOptionMenu for cat/prov, ScrollableComboBox for material."""

    _cached_cat_names = None
    _cached_prov_names = None
    _cached_prov_ids = None
    _cached_precio_hora = None
    _cached_margen_cristal = None

    # Default margins per category
    _DEFAULT_MARGINS = {
        "Cristal": "35",
        "Envío/Porte": "0",
        "Extras": "0",
    }
    _DEFAULT_MARGIN = "100"  # For all other categories

    def __init__(self, parent, app, mueble, data=None):
        super().__init__(parent, fg_color="transparent", height=44)
        self.app = app; self.mueble = mueble
        self._prov_materials = {}

        if DetailRow._cached_cat_names is None:
            DetailRow._cached_cat_names = [c["nombre"] for c in app.categoria_model.listar()]
            provs = app.proveedor_model.listar()
            DetailRow._cached_prov_names = ["(manual)"] + [p["nombre"] for p in provs]
            DetailRow._cached_prov_ids = {p["nombre"]: p["id"] for p in provs}
            DetailRow._cached_precio_hora = app.config_model.obtener_float("precio_hora_mano_obra", 25)
            DetailRow._cached_margen_cristal = app.config_model.obtener_float("margen_cristal", 35)

        # Category (CTkOptionMenu)
        self.cat_var = ctk.StringVar(value=DetailRow._cached_cat_names[0] if DetailRow._cached_cat_names else "")
        self.cat_menu = ctk.CTkOptionMenu(self, values=DetailRow._cached_cat_names,
                                           variable=self.cat_var, width=135, height=34,
                                           font=ctk.CTkFont(size=13),
                                           fg_color="#e8e8e8", text_color="#1a1a2e",
                                           button_color="#d0d0d0", button_hover_color="#b0b0b0",
                                           command=self._on_category_change)
        self.cat_menu.pack(side="left", padx=3)

        # Provider (CTkOptionMenu)
        self.prov_var = ctk.StringVar(value="(manual)")
        self.prov_menu = ctk.CTkOptionMenu(self, values=DetailRow._cached_prov_names,
                                            variable=self.prov_var, width=135, height=34,
                                            font=ctk.CTkFont(size=13),
                                            fg_color="#e8e8e8", text_color="#1a1a2e",
                                            button_color="#d0d0d0", button_hover_color="#b0b0b0",
                                            command=self._on_proveedor_change)
        self.prov_menu.pack(side="left", padx=3)

        # Material (ScrollableComboBox - searchable dropdown)
        self.desc_combo = ScrollableComboBox(self, values=[], width=250, height=34,
                                              command=self._on_material_select,
                                              placeholder_text="Material...",
                                              dropdown_font_size=20, dropdown_max_items=12,
                                              min_dropdown_width=450)
        self.desc_combo.pack(side="left", padx=3)

        # Cant + Precio (CTkEntry)
        self.cant_entry = ctk.CTkEntry(self, width=75, height=34, font=ctk.CTkFont(size=13))
        self.cant_entry.pack(side="left", padx=3); self.cant_entry.insert(0, "1")
        self.precio_entry = ctk.CTkEntry(self, width=95, height=34, font=ctk.CTkFont(size=13))
        self.precio_entry.pack(side="left", padx=3); self.precio_entry.insert(0, "0")

        # Per-line margin entry (before Total)
        self.margen_entry = ctk.CTkEntry(self, width=65, height=34, font=ctk.CTkFont(size=13))
        self.margen_entry.pack(side="left", padx=3)
        default_m = self._DEFAULT_MARGINS.get(self.cat_var.get(), self._DEFAULT_MARGIN)
        self.margen_entry.insert(0, default_m)

        self.total_label = ctk.CTkLabel(self, text="0.00€", width=90, font=ctk.CTkFont(size=12),
                                         text_color=app.COLOR_TEXT, anchor="e")
        self.total_label.pack(side="left", padx=3)

        ctk.CTkButton(self, text="x", width=26, height=26, fg_color="#dc3545", hover_color="#c1121f",
                      font=ctk.CTkFont(size=11),
                      command=lambda: mueble._remove_detail_row(self)).pack(side="left", padx=3)

        # Recalculate on FocusOut and Enter
        self.cant_entry.bind("<FocusOut>", lambda e: self._recalc())
        self.precio_entry.bind("<FocusOut>", lambda e: self._recalc())
        self.margen_entry.bind("<FocusOut>", lambda e: self._recalc())
        self.cant_entry.bind("<Return>", lambda e: self._recalc())
        self.precio_entry.bind("<Return>", lambda e: self._recalc())
        self.margen_entry.bind("<Return>", lambda e: self._recalc())

        if data:
            if data.get("categoria"): self.cat_var.set(data["categoria"])
            if data.get("proveedor"):
                self.prov_var.set(data["proveedor"])
                self._load_proveedor_materials(data["proveedor"])
            if data.get("descripcion"): self.desc_combo.set(data["descripcion"])
            if data.get("cantidad"):
                self.cant_entry.delete(0, "end"); self.cant_entry.insert(0, str(data["cantidad"]))
            if data.get("precio_unitario"):
                self.precio_entry.delete(0, "end"); self.precio_entry.insert(0, str(data["precio_unitario"]))
        else:
            # Auto-fill for special categories
            if self.cat_var.get() == "Mano de Obra":
                self.precio_entry.delete(0, "end")
                self.precio_entry.insert(0, str(DetailRow._cached_precio_hora))
                self.desc_combo.set("Mano de obra")
        self._update_total()

    def _on_category_change(self, cat):
        """Auto-fill price for Mano de Obra and auto-set margin per category."""
        # Auto-set margin based on category
        new_margin = self._DEFAULT_MARGINS.get(cat, self._DEFAULT_MARGIN)
        self.margen_entry.delete(0, "end")
        self.margen_entry.insert(0, new_margin)

        if cat == "Mano de Obra":
            self.precio_entry.delete(0, "end")
            self.precio_entry.insert(0, str(DetailRow._cached_precio_hora))
            self.desc_combo.set("Mano de obra")
        self._recalc()

    def _on_proveedor_change(self, prov):
        if prov == "(manual)":
            self.desc_combo.configure(values=[]); self.desc_combo.set(""); return
        self._load_proveedor_materials(prov)

    def _load_proveedor_materials(self, prov):
        pid = DetailRow._cached_prov_ids.get(prov)
        if not pid: return
        mats = self.app.historico_model.materiales_actuales_proveedor(pid)
        self._prov_materials[prov] = {m["descripcion_material"]: m for m in mats}
        names = [m["descripcion_material"] for m in mats]
        self.desc_combo.configure(values=names)
        if names:
            self.desc_combo.set(names[0])
            self._on_material_select(names[0])

    def _on_material_select(self, name):
        prov = self.prov_var.get()
        if prov in self._prov_materials:
            md = self._prov_materials[prov].get(name)
            if md:
                self.precio_entry.delete(0, "end"); self.precio_entry.insert(0, str(md["precio"]))
                cn = md["categoria_nombre"]
                if cn: self.cat_var.set(cn)
                self._recalc()

    def _recalc(self):
        self._update_total(); self.mueble._recalculate()

    def _update_total(self):
        self.total_label.configure(text=f"{self.get_total():,.2f}€")

    def get_total(self):
        try: return float(self.cant_entry.get().replace(",",".")) * float(self.precio_entry.get().replace(",","."))
        except ValueError: return 0

    def get_margen(self):
        try: return float(self.margen_entry.get().replace(",", "."))
        except ValueError: return 100

    def get_data(self):
        try: c = float(self.cant_entry.get().replace(",","."))
        except ValueError: c = 0
        try: p = float(self.precio_entry.get().replace(",","."))
        except ValueError: p = 0
        pv = self.prov_var.get()
        return {"categoria": self.cat_var.get(), "proveedor": "" if pv == "(manual)" else pv,
                "descripcion": self.desc_combo.get().strip(), "cantidad": c, "precio_unitario": p}
