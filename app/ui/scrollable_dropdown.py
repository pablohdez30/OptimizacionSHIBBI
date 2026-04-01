"""
ScrollableComboBox: A CTkComboBox replacement with a scrollable dropdown for long lists.
Supports search filtering as you type.
"""
import customtkinter as ctk
import tkinter as tk


class ScrollableComboBox(ctk.CTkFrame):
    """ComboBox with scrollable dropdown that handles long lists well."""

    def __init__(self, parent, values=None, width=250, height=30, command=None,
                 font=None, placeholder_text="", **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self._values = values or []
        self._filtered = list(self._values)
        self._command = command
        self._dropdown_open = False
        self._dropdown_win = None

        self._entry = ctk.CTkEntry(self, width=width, height=height, font=font,
                                    placeholder_text=placeholder_text)
        self._entry.pack(side="left", fill="x", expand=True)

        self._btn = ctk.CTkButton(self, text="▼", width=28, height=height,
                                   fg_color="#d0d0d0", hover_color="#b0b0b0",
                                   text_color="#333333", font=ctk.CTkFont(size=10),
                                   command=self._toggle_dropdown)
        self._btn.pack(side="left", padx=(2, 0))

        self._entry.bind("<KeyRelease>", self._on_type)
        self._entry.bind("<FocusOut>", self._on_focus_out)

    def get(self):
        return self._entry.get()

    def set(self, value):
        self._entry.delete(0, "end")
        self._entry.insert(0, value)

    def configure(self, **kwargs):
        if "values" in kwargs:
            self._values = kwargs.pop("values")
            self._filtered = list(self._values)
        super().configure(**kwargs)

    def bind(self, event, handler, add=None):
        self._entry.bind(event, handler, add)

    def _on_type(self, event=None):
        typed = self._entry.get().lower()
        if typed:
            self._filtered = [v for v in self._values if typed in v.lower()]
        else:
            self._filtered = list(self._values)
        if self._dropdown_open:
            self._update_dropdown_list()
        elif len(typed) >= 1:
            self._open_dropdown()

    def _on_focus_out(self, event=None):
        # Delay to allow click on dropdown item
        self.after(200, self._close_dropdown)

    def _toggle_dropdown(self):
        if self._dropdown_open:
            self._close_dropdown()
        else:
            self._filtered = list(self._values)
            self._open_dropdown()

    def _open_dropdown(self):
        if self._dropdown_open:
            return
        self._dropdown_open = True

        self._dropdown_win = tk.Toplevel(self)
        self._dropdown_win.withdraw()
        self._dropdown_win.overrideredirect(True)

        # Position below the entry
        x = self._entry.winfo_rootx()
        y = self._entry.winfo_rooty() + self._entry.winfo_height() + 2
        w = self._entry.winfo_width() + 30

        # Scrollable list
        frame = tk.Frame(self._dropdown_win, bg="#ffffff", bd=1, relief="solid")
        frame.pack(fill="both", expand=True)

        self._listbox = tk.Listbox(frame, font=("Segoe UI", 10), bg="#ffffff",
                                    selectbackground="#e94560", selectforeground="#ffffff",
                                    bd=0, highlightthickness=0, activestyle="none")
        scrollbar = tk.Scrollbar(frame, orient="vertical", command=self._listbox.yview)
        self._listbox.configure(yscrollcommand=scrollbar.set)

        self._listbox.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        self._listbox.bind("<ButtonRelease-1>", self._on_select)
        self._listbox.bind("<Return>", self._on_select)

        self._update_dropdown_list()

        # Size: show max 12 items
        n_items = min(len(self._filtered), 12)
        h = max(n_items * 22, 44)
        self._dropdown_win.geometry(f"{w}x{h}+{x}+{y}")
        self._dropdown_win.deiconify()
        self._dropdown_win.lift()

    def _update_dropdown_list(self):
        if not self._listbox:
            return
        self._listbox.delete(0, "end")
        for item in self._filtered:
            self._listbox.insert("end", item)

    def _on_select(self, event=None):
        sel = self._listbox.curselection()
        if sel:
            value = self._listbox.get(sel[0])
            self.set(value)
            self._close_dropdown()
            if self._command:
                self._command(value)

    def _close_dropdown(self):
        if self._dropdown_win:
            self._dropdown_win.destroy()
            self._dropdown_win = None
        self._dropdown_open = False
        self._listbox = None
