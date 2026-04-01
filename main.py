#!/usr/bin/env python3
"""ShibbiShop Manager - Furniture business management application."""

import sys
import os

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ui.app import ShibbiShopApp


def main():
    app = ShibbiShopApp()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()


if __name__ == "__main__":
    main()
