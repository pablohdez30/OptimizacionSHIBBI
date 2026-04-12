import os
import shutil
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
        "FACTURAS": "FACTURA",
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


def copiar_a_drive(filepath, app=None):
    """
    Copy a generated file to the Google Drive path if configured and enabled.

    Returns (success: bool, error_msg: str or None).
    Never raises — errors are returned as messages.
    """
    if not app or not filepath or not os.path.exists(filepath):
        return False, None

    try:
        enabled = app.config_model.obtener("auto_exportar_drive")
        if enabled != "1":
            return False, None

        ruta_drive = app.config_model.obtener("ruta_drive")
        if not ruta_drive or not ruta_drive.strip():
            return False, None

        ruta_drive = ruta_drive.strip()

        # Replicate the same folder structure: CAESPAN {year}/{tipo}/
        # Extract the tipo folder from the original path
        year = datetime.now().strftime("%Y")
        parent_dir = os.path.basename(os.path.dirname(filepath))  # e.g. "FACTURAS"
        drive_dir = os.path.join(ruta_drive, f"CAESPAN {year}", parent_dir)

        os.makedirs(drive_dir, exist_ok=True)

        dest = os.path.join(drive_dir, os.path.basename(filepath))
        shutil.copy2(filepath, dest)
        return True, None

    except PermissionError:
        return False, "Google Drive: sin permisos de escritura"
    except OSError as e:
        if "No space" in str(e) or "space" in str(e).lower() or e.errno == 28:
            return False, "Google Drive: no queda espacio"
        return False, f"Google Drive: {e}"
    except Exception as e:
        return False, f"Google Drive: {e}"
