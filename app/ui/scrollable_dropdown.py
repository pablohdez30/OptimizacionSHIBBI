"""
ScrollableComboBox: Professional searchable dropdown with scrollable list.
- Large, readable font
- Real-time filtering as you type
- Scrollbar for long lists
- Hover highlight on items
- Click or Enter to select
"""
import customtkinter as ctk
import tkinter as tk


class ScrollableComboBox(ctk.CTkFrame):
    """Searchable ComboBox with scrollable dropdown for long lists."""

    def __init__(self, parent, values=None, width=250, height=32, command=None,
                 font=None, placeholder_text="Escribe para buscar...",
                 dropdown_font_size=20, dropdown_max_items=25, min_dropdown_width=500, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self._values = values or []
        self._filtered = list(self._values)
        self._command = command
        self._dropdown_font_size = dropdown_font_size
        self._dropdown_max_items = dropdown_max_items
        self._min_dropdown_width = min_dropdown_width
        self._dropdown_open = False
        self._dropdown_win = None
        self._listbox = None
        self._selected_idx = -1
        self._filter_after_id = None

        # Entry field
        self._entry = ctk.CTkEntry(self, width=width - 32, height=height,
                                    font=font or ctk.CTkFont(size=13),
                                    placeholder_text=placeholder_text)
        self._entry.pack(side="left", fill="x", expand=True)

        # Dropdown toggle button
        self._btn = ctk.CTkButton(self, text="▼", width=32, height=height,
                                   fg_color="#d5d5d5", hover_color="#bbb",
                                   text_color="#444", font=ctk.CTkFont(size=11),
                                   corner_radius=6,
                                   command=self._toggle_dropdown)
        self._btn.pack(side="left", padx=(2, 0))

        # Bindings - NO FocusIn (was creating Toplevel on every focus, blocking event loop)
        self._entry.bind("<KeyRelease>", self._on_key)
        self._entry.bind("<Escape>", lambda e: self._close_dropdown())

    def get(self):
        return self._entry.get()

    def set(self, value):
        self._entry.delete(0, "end")
        self._entry.insert(0, value)

    def configure(self, **kwargs):
        if "values" in kwargs:
            self._values = kwargs.pop("values") or []
            self._filtered = list(self._values)
        if kwargs:
            super().configure(**kwargs)

    def bind(self, event, handler, add=None):
        self._entry.bind(event, handler, add)

    def _on_key(self, event=None):
        """Filter list with debounce to avoid blocking UI on fast typing."""
        # Handle navigation keys immediately (no debounce)
        if event and event.keysym == "Down":
            self._move_selection(1)
            return
        if event and event.keysym == "Up":
            self._move_selection(-1)
            return
        if event and event.keysym == "Return":
            self._select_current()
            return
        # Ignore modifier keys that don't change text
        if event and event.keysym in ("Shift_L", "Shift_R", "Control_L", "Control_R",
                                       "Alt_L", "Alt_R", "Caps_Lock", "Tab"):
            return

        # Debounce filtering
        if self._filter_after_id:
            self.after_cancel(self._filter_after_id)
        self._filter_after_id = self.after(150, self._apply_filter)

    def _apply_filter(self):
        """Apply the filter after debounce delay."""
        typed = self._entry.get().strip().lower()
        if typed:
            self._filtered = [v for v in self._values if typed in v.lower()]
        else:
            self._filtered = list(self._values)

        self._selected_idx = -1

        if self._dropdown_open:
            self._refresh_listbox()
            self._resize_dropdown()
        else:
            self._open_dropdown()

    def _move_selection(self, delta):
        """Move selection up/down in the dropdown."""
        if not self._listbox or not self._filtered:
            return
        self._selected_idx = max(0, min(len(self._filtered) - 1, self._selected_idx + delta))
        self._listbox.selection_clear(0, "end")
        self._listbox.selection_set(self._selected_idx)
        self._listbox.see(self._selected_idx)

    def _select_current(self):
        """Select the currently highlighted item."""
        if self._listbox and 0 <= self._selected_idx < len(self._filtered):
            value = self._filtered[self._selected_idx]
            self.set(value)
            self._close_dropdown()
            if self._command:
                self._command(value)

    def _toggle_dropdown(self):
        if self._dropdown_open:
            self._close_dropdown()
        else:
            self._filtered = list(self._values)
            self._selected_idx = -1
            self._open_dropdown()

    def _open_dropdown(self):
        if self._dropdown_open:
            return
        self._dropdown_open = True

        self._dropdown_win = tk.Toplevel(self)
        self._dropdown_win.withdraw()
        self._dropdown_win.overrideredirect(True)
        self._dropdown_win.configure(bg="#ffffff")

        # Outer frame with shadow-like border
        outer = tk.Frame(self._dropdown_win, bg="#999999", bd=0)
        outer.pack(fill="both", expand=True, padx=1, pady=1)

        inner = tk.Frame(outer, bg="#ffffff", bd=0)
        inner.pack(fill="both", expand=True)

        # Count label
        self._count_label = tk.Label(inner, text="", font=("Segoe UI", 10),
                                      fg="#888", bg="#f5f5f5", anchor="w")
        self._count_label.pack(fill="x", padx=0, pady=(0, 1))

        # Listbox + Scrollbar
        list_frame = tk.Frame(inner, bg="#ffffff")
        list_frame.pack(fill="both", expand=True)

        self._listbox = tk.Listbox(
            list_frame,
            font=("Segoe UI", self._dropdown_font_size),
            bg="#ffffff",
            fg="#1a1a2e",
            selectbackground="#e94560",
            selectforeground="#ffffff",
            bd=0,
            highlightthickness=0,
            activestyle="none",
            relief="flat",
        )
        scrollbar = tk.Scrollbar(list_frame, orient="vertical", command=self._listbox.yview)
        self._listbox.configure(yscrollcommand=scrollbar.set)

        self._listbox.pack(side="left", fill="both", expand=True, padx=(4, 0))
        scrollbar.pack(side="right", fill="y")

        # Bindings
        self._listbox.bind("<ButtonRelease-1>", self._on_click_select)
        self._listbox.bind("<Double-Button-1>", self._on_click_select)
        self._listbox.bind("<Motion>", self._on_hover)

        # Keep dropdown open when clicking inside it
        self._dropdown_win.bind("<FocusOut>", self._on_dropdown_focus_out)

        self._refresh_listbox()
        self._resize_dropdown()

        self._dropdown_win.deiconify()
        self._dropdown_win.lift()
        self._dropdown_win.attributes("-topmost", True)

        # Close dropdown when clicking anywhere outside it
        self.winfo_toplevel().bind("<Button-1>", self._on_global_click, add=True)

    def _refresh_listbox(self):
        """Update listbox contents from filtered list."""
        if not self._listbox:
            return
        self._listbox.delete(0, "end")
        for item in self._filtered:
            self._listbox.insert("end", f"  {item}")

        # Update count
        total = len(self._values)
        shown = len(self._filtered)
        if self._count_label:
            if shown < total:
                self._count_label.configure(text=f"  {shown} de {total} resultados")
            else:
                self._count_label.configure(text=f"  {total} elementos")

    def _resize_dropdown(self):
        """Resize dropdown window based on content."""
        if not self._dropdown_win:
            return

        # Position below the entry - ALWAYS open downward
        self.update_idletasks()
        x = self._entry.winfo_rootx()
        y = self._entry.winfo_rooty() + self._entry.winfo_height() + 2
        w = max(self._entry.winfo_width() + 34, self._min_dropdown_width)

        # Height based on font size
        item_h = self._dropdown_font_size * 2 + 6
        n_items = min(max(len(self._filtered), 1), self._dropdown_max_items)
        h = (n_items * item_h) + 28

        # Limit height to available screen space below, but always open down
        screen_h = self.winfo_screenheight()
        max_h = screen_h - y - 50
        if max_h < 100:
            max_h = 400  # Fallback minimum
        h = min(h, max_h)
        h = max(h, 100)  # Never smaller than 100px

        self._dropdown_win.geometry(f"{w}x{h}+{x}+{y}")

    def _on_hover(self, event=None):
        """Highlight item on hover."""
        if not self._listbox:
            return
        idx = self._listbox.nearest(event.y)
        self._listbox.selection_clear(0, "end")
        self._listbox.selection_set(idx)
        self._selected_idx = idx

    def _on_click_select(self, event=None):
        """Select item on click."""
        if not self._listbox:
            return
        sel = self._listbox.curselection()
        if sel:
            raw = self._listbox.get(sel[0])
            value = raw.strip()  # Remove the leading spaces we added
            self.set(value)
            self._close_dropdown()
            if self._command:
                self._command(value)

    def _on_dropdown_focus_out(self, event=None):
        """Close dropdown when focus leaves, with delay for click handling."""
        if self._dropdown_win:
            self.after(250, self._check_close)

    def _check_close(self):
        """Only close if focus is not on entry or dropdown."""
        try:
            focused = self.focus_get()
            if focused == self._entry._entry:
                return  # User clicked back on entry, keep open
            if self._dropdown_win and focused and str(focused).startswith(str(self._dropdown_win)):
                return  # Focus is inside dropdown
        except (KeyError, AttributeError):
            pass
        self._close_dropdown()

    def _on_global_click(self, event=None):
        """Close dropdown if click is outside entry and dropdown."""
        if not self._dropdown_open:
            return
        try:
            w = event.widget
            # Check if click is on the entry, button, or inside the dropdown
            if w == self._entry._entry or w == self._entry or w == self._btn:
                return
            if self._dropdown_win and str(w).startswith(str(self._dropdown_win)):
                return
            if self._listbox and (w == self._listbox):
                return
        except (AttributeError, tk.TclError):
            pass
        self._close_dropdown()

    def _close_dropdown(self):
        # Unbind global click
        try:
            self.winfo_toplevel().unbind("<Button-1>")
        except (tk.TclError, AttributeError):
            pass
        if self._dropdown_win:
            try:
                self._dropdown_win.destroy()
            except tk.TclError:
                pass
            self._dropdown_win = None
        self._dropdown_open = False
        self._listbox = None
        self._count_label = None
