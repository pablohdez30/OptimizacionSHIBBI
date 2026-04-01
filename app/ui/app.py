import customtkinter as ctk
from app.database import Database
from app.database.models import (
    ClienteModel, ProveedorModel, PresupuestoModel,
    CategoriaModel, ConfiguracionModel, HistoricoPreciosModel
)


class ShibbiShopApp(ctk.CTk):
    """Main application window with sidebar navigation."""

    # Color palette
    COLOR_PRIMARY = "#1a1a2e"       # Dark navy sidebar
    COLOR_SECONDARY = "#16213e"     # Slightly lighter navy
    COLOR_ACCENT = "#e94560"        # Red accent (ShibbiShop brand)
    COLOR_ACCENT_HOVER = "#c73e54"
    COLOR_BG = "#f0f2f5"            # Light gray background
    COLOR_CARD = "#ffffff"          # White cards
    COLOR_TEXT = "#1a1a2e"          # Dark text
    COLOR_TEXT_LIGHT = "#8d99ae"    # Muted text
    COLOR_SUCCESS = "#2d6a4f"
    COLOR_WARNING = "#e9c46a"
    COLOR_DANGER = "#e76f51"

    def __init__(self):
        super().__init__()

        self.title("ShibbiShop Manager")
        self.geometry("1280x780")
        self.minsize(1024, 600)

        ctk.set_appearance_mode("light")
        ctk.set_default_color_theme("blue")

        # Database
        self.db = Database()
        self.cliente_model = ClienteModel(self.db)
        self.proveedor_model = ProveedorModel(self.db)
        self.presupuesto_model = PresupuestoModel(self.db)
        self.categoria_model = CategoriaModel(self.db)
        self.config_model = ConfiguracionModel(self.db)
        self.historico_model = HistoricoPreciosModel(self.db)

        # Current view reference
        self.current_view = None
        self.nav_buttons = {}

        self._build_ui()
        self._show_view("dashboard")

    def _build_ui(self):
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # --- Sidebar ---
        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0,
                                     fg_color=self.COLOR_PRIMARY)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_propagate(False)

        # Logo / Brand
        brand_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        brand_frame.pack(fill="x", padx=20, pady=(25, 5))

        ctk.CTkLabel(brand_frame, text="SHIBBISHOP",
                     font=ctk.CTkFont(size=20, weight="bold"),
                     text_color=self.COLOR_ACCENT).pack(anchor="w")
        ctk.CTkLabel(brand_frame, text="Manager",
                     font=ctk.CTkFont(size=13),
                     text_color=self.COLOR_TEXT_LIGHT).pack(anchor="w")

        # Separator
        sep = ctk.CTkFrame(self.sidebar, height=1, fg_color=self.COLOR_SECONDARY)
        sep.pack(fill="x", padx=20, pady=(15, 15))

        # Navigation buttons
        nav_items = [
            ("dashboard", "Dashboard"),
            ("nuevo_presupuesto", "Nuevo Presupuesto"),
            ("presupuestos", "Presupuestos"),
            ("clientes", "Clientes"),
            ("proveedores", "Proveedores"),
            ("configuracion", "Configuración"),
        ]

        for key, label in nav_items:
            btn = ctk.CTkButton(
                self.sidebar, text=f"  {label}", anchor="w",
                font=ctk.CTkFont(size=14),
                height=42, corner_radius=8,
                fg_color="transparent",
                text_color="#c8d6e5",
                hover_color=self.COLOR_SECONDARY,
                command=lambda k=key: self._show_view(k)
            )
            btn.pack(fill="x", padx=12, pady=2)
            self.nav_buttons[key] = btn

        # Bottom spacer + version
        self.sidebar.pack_propagate(False)
        spacer = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        spacer.pack(fill="both", expand=True)

        ctk.CTkLabel(self.sidebar, text="v1.0",
                     font=ctk.CTkFont(size=11),
                     text_color="#4a5568").pack(pady=(0, 15))

        # --- Main content area ---
        self.content_frame = ctk.CTkFrame(self, fg_color=self.COLOR_BG, corner_radius=0)
        self.content_frame.grid(row=0, column=1, sticky="nsew")
        self.content_frame.grid_columnconfigure(0, weight=1)
        self.content_frame.grid_rowconfigure(0, weight=1)

    def _show_view(self, view_name):
        # Update nav button styles
        for key, btn in self.nav_buttons.items():
            if key == view_name:
                btn.configure(fg_color=self.COLOR_ACCENT,
                              text_color="#ffffff",
                              hover_color=self.COLOR_ACCENT_HOVER)
            else:
                btn.configure(fg_color="transparent",
                              text_color="#c8d6e5",
                              hover_color=self.COLOR_SECONDARY)

        # Clear current view
        if self.current_view:
            self.current_view.destroy()

        # Import and show new view
        if view_name == "dashboard":
            from app.ui.dashboard import DashboardView
            self.current_view = DashboardView(self.content_frame, self)
        elif view_name == "nuevo_presupuesto":
            from app.ui.presupuesto_nuevo import NuevoPresupuestoView
            self.current_view = NuevoPresupuestoView(self.content_frame, self)
        elif view_name == "presupuestos":
            from app.ui.presupuestos import PresupuestosView
            self.current_view = PresupuestosView(self.content_frame, self)
        elif view_name == "clientes":
            from app.ui.clientes import ClientesView
            self.current_view = ClientesView(self.content_frame, self)
        elif view_name == "proveedores":
            from app.ui.proveedores import ProveedoresView
            self.current_view = ProveedoresView(self.content_frame, self)
        elif view_name == "configuracion":
            from app.ui.configuracion import ConfiguracionView
            self.current_view = ConfiguracionView(self.content_frame, self)

        if self.current_view:
            self.current_view.grid(row=0, column=0, sticky="nsew", padx=0, pady=0)

    def show_nuevo_presupuesto(self, presupuesto_id=None):
        """Navigate to new budget, optionally editing an existing one."""
        for key, btn in self.nav_buttons.items():
            if key == "nuevo_presupuesto":
                btn.configure(fg_color=self.COLOR_ACCENT, text_color="#ffffff",
                              hover_color=self.COLOR_ACCENT_HOVER)
            else:
                btn.configure(fg_color="transparent", text_color="#c8d6e5",
                              hover_color=self.COLOR_SECONDARY)
        if self.current_view:
            self.current_view.destroy()
        from app.ui.presupuesto_nuevo import NuevoPresupuestoView
        self.current_view = NuevoPresupuestoView(
            self.content_frame, self, presupuesto_id=presupuesto_id
        )
        self.current_view.grid(row=0, column=0, sticky="nsew", padx=0, pady=0)

    def on_closing(self):
        self.db.close()
        self.destroy()
