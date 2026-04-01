"""
Seed script: loads providers (SFD, Tableros Martinez) with materials,
and clients from Excel filenames visible in the screenshot.
Run once: python -m app.seed_data
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import Database
from app.database.models import (
    ClienteModel, ProveedorModel, CategoriaModel,
    HistoricoPreciosModel, ConfiguracionModel
)


def seed_all():
    db = Database()
    cm = ClienteModel(db)
    pm = ProveedorModel(db)
    catm = CategoriaModel(db)
    hm = HistoricoPreciosModel(db)

    # Get category IDs
    cat_hierro = catm.obtener_por_nombre("Hierro")
    cat_madera = catm.obtener_por_nombre("Madera")

    if not cat_hierro or not cat_madera:
        print("ERROR: Categorías base no encontradas. Ejecuta la app primero.")
        return

    hierro_id = cat_hierro["id"]
    madera_id = cat_madera["id"]

    # =============================================
    # PROVEEDOR: SFD (hierro/metal)
    # =============================================
    existing = pm.buscar("SFD")
    if existing:
        sfd_id = existing[0]["id"]
        print(f"SFD ya existe (id={sfd_id}), actualizando materiales...")
    else:
        sfd_id = pm.crear("SFD", notas="Proveedor de hierro y metal")
        print(f"SFD creado (id={sfd_id})")

    # SFD materials - using latest price per unique material+medida
    # Format: (description, price_per_meter, unit)
    sfd_materials = [
        # Tubos Rectangulares
        ("Tubo Rectangular 20x10x1,5", 1.25, "m"),
        ("Tubo Rectangular 30x20x1,5", 1.55, "m"),
        ("Tubo Rectangular 40x20x1,5", 2.20, "m"),
        ("Tubo Rectangular 40x30x1,5", 2.45, "m"),
        ("Tubo Rectangular 50x20x1,5", 2.95, "m"),
        ("Tubo Rectangular 50x40x1,5", 3.35, "m"),
        ("Tubo Rectangular 60x15x1,5", 2.85, "m"),
        ("Tubo Rectangular 60x20x1,5", 3.05, "m"),
        ("Tubo Rectangular 60x30x1,5", 3.40, "m"),
        ("Tubo Rectangular 60x40x1,5", 3.65, "m"),
        ("Tubo Rectangular 80x20x2", 5.20, "m"),
        ("Tubo Rectangular 80x20x1,5", 3.90, "m"),
        ("Tubo Rectangular 80x40x2", 5.50, "m"),
        ("Tubo Rectangular 80x50x2", 6.20, "m"),
        ("Tubo Rectangular 100x20x1,5", 5.60, "m"),
        ("Tubo Rectangular 100x50x2", 7.50, "m"),
        ("Tubo Rectangular 140x60x3", 107.96, "m"),
        # Tubos Cuadrados
        ("Tubo Cuadrado 10x10x1", 0.72, "m"),
        ("Cuadradillo macizo 10", 1.20, "m"),
        ("Tubo Cuadrado 14x1,5", 1.10, "m"),
        ("Tubo Cuadrado 16x1,5", 1.16, "m"),
        ("Tubo Cuadrado 20x1,5", 1.39, "m"),
        ("Tubo Cuadrado 25x1,5", 1.75, "m"),
        ("Tubo Cuadrado 30x1,5", 2.05, "m"),
        ("Tubo Cuadrado 40x1,5", 2.75, "m"),
        ("Tubo Cuadrado 40x4", 6.90, "m"),
        ("Tubo Cuadrado 50x1,5", 4.50, "m"),
        ("Tubo Cuadrado 60x1,5", 5.00, "m"),
        ("Tubo Cuadrado 70x2", 7.60, "m"),
        ("Tubo Cuadrado 80x2", 7.00, "m"),
        # Tubos Redondos
        ("Tubo Redondo 18x1,5", 1.12, "m"),
        ("Tubo Redondo 20x1,5", 1.18, "m"),
        ("Tubo Redondo INOX 20x1,5 A-304", 2.01, "m"),
        ("Tubo Redondo 25x1,5", 1.85, "m"),
        ("Tubo Redondo 30x1,5", 1.85, "m"),
        ("Tubo Redondo 40x1,5", 2.70, "m"),
        ("Tubo Redondo GALVANIZADO 40x1,5", 2.60, "m"),
        ("Tubo Redondo 40x3", 4.15, "m"),
        ("Tubo Redondo 50x1,5", 2.90, "m"),
        ("Tubo Redondo 50x2", 4.00, "m"),
        ("Tubo Redondo 100x2", 8.20, "m"),
        # Pletinas
        ("Pletina 16x3", 1.20, "m"),
        ("Pletina 20x3", 1.25, "m"),
        ("Pletina 20x5", 1.51, "m"),
        ("Pletina 25x3", 1.55, "m"),
        ("Pletina 30x3", 1.20, "m"),
        ("Pletina 30x5", 1.20, "m"),
        ("Pletina 40x4", 1.50, "m"),
        ("Pletina 40x5", 1.50, "m"),
        ("Pletina 40x6", 20.00, "m"),
        ("Pletina 40x10", 1.40, "m"),
        ("Pletina 50x40", 1.70, "m"),
        ("Pletina 80x5", 0.92, "m"),
        ("Pletina 80x10", 1.35, "m"),
        ("Pletina latón 40x4", 71.50, "m"),
        # Ángulos
        ("Ángulo chapa 15x1,5", 2.36, "m"),
        ("Ángulo chapa 20x1,5", 2.01, "m"),
        ("Ángulo 20x3", 1.23, "m"),
        ("Ángulo 25x3", 1.10, "m"),
        ("Ángulo 30x3", 1.10, "m"),
        ("Ángulo 40x4", 0.83, "m"),
        # Varillas
        ("Varilla 8", 1.50, "m"),
        ("Varilla 10", 0.97, "m"),
        ("Varilla 14", 0.97, "m"),
        ("Varilla 18", 1.00, "m"),
        ("Varilla 20", 0.90, "m"),
        # Cercos
        ("Cerco 30x15x1,5", 2.55, "m"),
        ("Cerco 35x15x1,5", 2.30, "m"),
        ("Cerco 50x40x2", 5.10, "m"),
        # Perfiles U
        ("U 40x20/3", 0.92, "m"),
        ("U 20x20x20x1,5", 2.05, "m"),
        ("U 60", 0.905, "m"),
        # Galvanizado
        ("Tubo Galvanizado 16x16x1,5", 1.60, "m"),
        ("Tubo Galvanizado 35x35x1,5", 3.45, "m"),
        ("Tubo Galvanizado 40x30x1,5", 3.34, "m"),
        # Corrugado
        ("Corrugado B500S RE16", 1.45, "m"),
        ("Corrugado B500S", 0.92, "m"),
        ("Corrugado RED 6", 0.95, "m"),
        # Simple T
        ("Simple T 30", 1.45, "m"),
        ("Simple T 40", 1.45, "m"),
        # Otros
        ("Chapa 940x640x1,5", 16.80, "ud"),
        ("Panel Sandwich 30mm BCO/BCO", 26.00, "m"),
        ("Metal Deploye 46x75x20x1,5", 41.50, "ud"),
        ("Redondo INOX calibrado", 7.96, "m"),
        ("Malla electrosoldada 100x100x4", 6.50, "ud"),
        ("Redondos calibrados 4mm", 3.00, "m"),
        ("Chapa galvanizada 2500x1250x1,5", 1.36, "ud"),
    ]

    for desc, precio, unidad in sfd_materials:
        hm.registrar_precio(sfd_id, hierro_id, desc, precio, unidad)

    print(f"  {len(sfd_materials)} materiales cargados para SFD")

    # =============================================
    # PROVEEDOR: Tableros Martinez (madera)
    # =============================================
    existing = pm.buscar("Tableros Martinez")
    if existing:
        tm_id = existing[0]["id"]
        print(f"Tableros Martinez ya existe (id={tm_id}), actualizando materiales...")
    else:
        tm_id = pm.crear("Tableros Martinez", notas="Proveedor de tableros y madera")
        print(f"Tableros Martinez creado (id={tm_id})")

    tm_materials = [
        # Contrachapados Chopo
        ("Contrachapado Chopo 4mm 250x122", 0, "ud"),
        ("Contrachapado Chopo 7mm 250x122", 0, "ud"),
        ("Contrachapado Chopo 10mm 250x122", 32.50, "ud"),
        ("Contrachapado Chopo 12mm 250x122", 0, "ud"),
        ("Contrachapado Chopo 15mm 250x122", 43.00, "ud"),
        ("Contrachapado Chopo 20mm 250x122", 58.90, "ud"),
        # Contrachapados Abedul
        ("Contrachapado Abedul 12mm 250x125", 0, "ud"),
        ("Contrachapado Abedul 15mm WBP", 0, "ud"),
        ("Contrachapado Abedul 18mm", 0, "ud"),
        ("Contrachapado Abedul 30mm WPM", 0, "ud"),
        # Otros contrachapados
        ("Contrachapado Carrocería 18mm", 0, "ud"),
        ("Contrachapado Flexible 5mm 250x122", 0, "ud"),
        # MDF
        ("MDF 10mm 244x122", 15.56, "ud"),
        ("MDF 16mm 244x122", 22.55, "ud"),
        ("MDF 19mm 244x122", 26.90, "ud"),
        ("MDF 22mm 244x122", 0, "ud"),
        ("MDF 30mm 244x122", 0, "ud"),
        ("MDF Hidrófugo 10mm 285x210", 0, "ud"),
        ("MDF 16mm 285x210", 0, "ud"),
        # Tableros blancos
        ("Tablero Blanco WAX Hidrófugo 16mm 285x210", 0, "ud"),
        ("Tablero Blanco WAX 10mm 285x210", 0, "ud"),
        ("Tablero Blanco PLAST 16mm 244x122", 0, "ud"),
        # Tableros Roble
        ("Tablero Roble HERA S.PAN 16mm 244x122", 38.00, "ud"),
        ("Tablero Roble HERA S.PAN 10mm 244x122", 34.60, "ud"),
        # Rechapados
        ("Rechapado Pino Valsaín 10mm 244x122", 0, "ud"),
        ("Rechapado Pino 4mm una cara", 42.00, "ud"),
        ("Rechapado Roble 15mm", 82.00, "ud"),
        ("Rechapado Roble 19mm 244x122", 0, "ud"),
        ("Rechapado Roble 19mm 285x210", 0, "ud"),
        ("Rechapado Roble 10mm 244x122", 0, "ud"),
        ("Roble Natural 31mm 244x122", 0, "ud"),
        # Cantos y listones
        ("ML Canto Pino Valsaín 0,8mm", 1.35, "m"),
        ("ML Canto Madera Laminada 1mm x33", 0, "m"),
        ("ML Listón Roble 20x15 macizo", 0, "m"),
        ("ML Canto Natural Roble 80", 0, "m"),
        # Otros
        ("Tablero Aglomerado Crudo 30mm 244x122", 0, "ud"),
        ("Cajonera 45x40 4 cajones", 88.75, "ud"),
        ("Canto laminado (para cajonera)", 10.75, "ud"),
        ("Pegamento (para cajonera)", 6.40, "ud"),
    ]

    # Filter out zero-price entries? No, keep them - user may fill in later
    for desc, precio, unidad in tm_materials:
        if precio > 0:
            hm.registrar_precio(tm_id, madera_id, desc, precio, unidad)
        else:
            hm.registrar_precio(tm_id, madera_id, desc, 0, unidad)

    print(f"  {len(tm_materials)} materiales cargados para Tableros Martinez")

    # =============================================
    # CLIENTES (from screenshot - Excel filenames)
    # =============================================
    clientes = [
        "Agustina Verliac cerramiento",
        "Alvaro barandilla",
        "Alvaro Rospitos barandilla",
        "Ana Centro",
        "Beatriz Martinez",
        "CAÑOS DE MECA",
        "Daniel Pardo",
        "Diana Las Rozas",
        "Doble y Gilda",
        "Econvives Mesa",
        "Evelin",
        "Gonzalo Basa",
        "Guiomar",
        "ICR",
        "Infi Gloss Mesa madera",
        "Javier Calvo",
        "Jose Silva",
        "Juan Tena TRAFALGAR",
        "Julia Hernandez-Gil",
        "lara",
        "Lucas y Hernández",
        "maite",
        "Maria Bustamante",
        "Mariñas",
        "Matilde Aniceto",
        "Miguel Framis",
        "Monica Diago (Rocio)",
        "Monica Diago",
        "Nacho TRAFALGAR",
        "Natalia López Peña",
        "Oh My Kimchi",
        "Patricia Ocon",
        "Paulina",
        "Pilar cortes mesa campaspero",
        "Reyes y Manuel Espejo Escritorio",
        "Sofia Guardeño",
        "Trimmina",
    ]

    added = 0
    skipped = 0
    for nombre in clientes:
        existing = cm.buscar(nombre)
        # Check exact match
        exact = any(c["nombre"] == nombre for c in existing)
        if not exact:
            cm.crear(nombre)
            added += 1
        else:
            skipped += 1

    print(f"  Clientes: {added} añadidos, {skipped} ya existían")

    db.close()
    print("\nDatos cargados correctamente.")


if __name__ == "__main__":
    seed_all()
