#!/usr/bin/env python3
"""ShibbiShop Manager - Aplicación de gestión para ShibbiShop."""

from shibbishop.database.db_manager import init_db
from shibbishop.ui.app import ShibbiShopApp


def main():
    init_db()
    app = ShibbiShopApp()
    app.mainloop()


if __name__ == "__main__":
    main()
