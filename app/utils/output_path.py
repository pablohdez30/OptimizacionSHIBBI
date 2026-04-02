import os
from datetime import datetime


def get_output_path(tipo, numero, cliente_nombre, extension, app=None):
    """
    Build the standard output file path for generated documents.

    tipo: "FACTURAS", "PRESUPUESTOS", "DESGLOSES"
    numero: document number, e.g. "26-025"
    cliente_nombre: client name (will be sanitized)
    extension: file extension without dot, e.g. "pdf", "xlsx"
    app: optional app instance to read configured output path

    Returns full filepath like:
        {ruta_salida}/CAESPAN 2026/FACTURAS/Factura_26-025_ClientName.pdf
    """
    year = datetime.now().strftime("%Y")

    # Try to get configured output path
    base_output = None
    if app:
        try:
            base_output = app.config_model.obtener("ruta_salida")
        except Exception:
            pass

    if not base_output:
        base_output = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output"
        )

    # Sanitize client name
    safe_name = "".join(
        c if c.isalnum() or c in (" ", "-", "_") else "_"
        for c in cliente_nombre
    ).strip()

    # Singular form for filename
    tipo_singular = {
        "FACTURAS": "Factura",
        "PRESUPUESTOS": "Presupuesto",
        "DESGLOSES": "Desglose",
    }.get(tipo, tipo)

    output_dir = os.path.join(base_output, f"CAESPAN {year}", tipo)
    os.makedirs(output_dir, exist_ok=True)

    filename = f"{tipo_singular}_{numero}_{safe_name}.{extension}"
    filepath = os.path.join(output_dir, filename)

    # If file is locked, use timestamped name
    if os.path.exists(filepath):
        try:
            with open(filepath, "ab") as f:
                pass
        except PermissionError:
            ts = datetime.now().strftime("%H%M%S")
            filename = f"{tipo_singular}_{numero}_{safe_name}_{ts}.{extension}"
            filepath = os.path.join(output_dir, filename)

    return filepath
