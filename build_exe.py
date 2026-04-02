"""
Script para generar el .exe de ShibbiShop Manager.
Ejecutar: python build_exe.py
Genera: dist/ShibbiShop Manager.exe
"""
import subprocess
import sys
import os

def build():
    # Ensure PyInstaller is installed
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller", "-q"])

    # Paths
    base = os.path.dirname(os.path.abspath(__file__))
    icon = os.path.join(base, "app", "assets", "icon.ico")
    logo = os.path.join(base, "app", "assets", "logo_shibbi.jpg")
    template = os.path.join(base, "PresupuestoPlantilla.xlsx")

    # Build command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=ShibbiShop Manager",
        "--onefile",
        "--windowed",  # No console window
        f"--icon={icon}",
        # Include data files
        f"--add-data={logo};app/assets",
        f"--add-data={icon};app/assets",
    ]

    # Include template if exists
    if os.path.exists(template):
        cmd.append(f"--add-data={template};.")

    # Include ShibbiLOGO if exists
    shibbi_logo = os.path.join(base, "ShibbiLOGO.jpg")
    if os.path.exists(shibbi_logo):
        cmd.append(f"--add-data={shibbi_logo};.")

    # Hidden imports for customtkinter
    cmd.extend([
        "--hidden-import=customtkinter",
        "--hidden-import=PIL",
        "--hidden-import=PIL._tkinter_finder",
        "--hidden-import=openpyxl",
        "--hidden-import=reportlab",
        "--collect-all=customtkinter",
    ])

    cmd.append("main.py")

    print("Generando ShibbiShop Manager.exe...")
    print(f"Comando: {' '.join(cmd)}")
    subprocess.check_call(cmd)

    print("\n" + "="*50)
    print("LISTO!")
    print(f"El .exe está en: {os.path.join(base, 'dist', 'ShibbiShop Manager.exe')}")
    print("\nPara usarlo:")
    print("1. Copia 'ShibbiShop Manager.exe' donde quieras")
    print("2. Copia 'PresupuestoPlantilla.xlsx' en la misma carpeta")
    print("3. Doble clic para abrir")
    print("="*50)


if __name__ == "__main__":
    build()
