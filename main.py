#!/usr/bin/env python3
"""ShibbiShop Manager - Furniture business management application."""

import sys
import os


def get_base_path():
    """Get the base path - works both for normal Python and PyInstaller .exe"""
    if getattr(sys, 'frozen', False):
        # Running as .exe (PyInstaller)
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))


# Set base path for imports and file access
BASE_PATH = get_base_path()
sys.path.insert(0, BASE_PATH)

# Set working directory so relative paths work
os.chdir(BASE_PATH)

from app.ui.app import ShibbiShopApp


def main():
    app = ShibbiShopApp()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()


if __name__ == "__main__":
    main()
