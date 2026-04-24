"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/nuevo-presupuesto", label: "Nuevo Presupuesto", icon: "plus" },
  { href: "/presupuestos", label: "Presupuestos", icon: "file" },
  { href: "/facturas", label: "Facturas", icon: "invoice" },
  { href: "/historico-muebles", label: "Histórico Muebles", icon: "archive" },
  { href: "/calendario", label: "Calendario", icon: "calendar" },
  { href: "/clientes", label: "Clientes", icon: "users" },
  { href: "/proveedores", label: "Proveedores", icon: "truck" },
  { href: "/configuracion", label: "Configuración", icon: "settings" },
];

const Icon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
      );
    case "invoice":
      return (
        <svg {...props}>
          <path d="M16 3H8a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2V5a2 2 0 0 0-2-2z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
    case "archive":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="5" rx="1" />
          <path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="8" r="4" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M17 4.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "truck":
      return (
        <svg {...props}>
          <path d="M1 3h14v13H1zM15 8h4l3 3v5h-7" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    default:
      return null;
  }
};

function initials(input: string) {
  const parts = input.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <aside className="w-[220px] shrink-0 h-screen bg-surface-1 border-r border-border flex flex-col overflow-y-auto">
      <div className="px-6 pt-7 pb-4">
        <div className="text-[20px] font-bold tracking-tight gold-grad">
          SHIBBISHOP
        </div>
        <div className="text-sm text-text-muted -mt-1">Manager</div>
      </div>

      <div className="dashed-sep mx-6" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-colors ${
                active
                  ? "bg-gold text-black font-medium"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bloque de usuario + logout */}
      <div className="border-t border-surface-2 px-4 py-4">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-gold-dark text-bg grid place-items-center text-[11px] font-bold flex-shrink-0">
            {email ? initials(email) : "·"}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-text truncate" title={email || ""}>
              {email || "—"}
            </div>
            <div className="mono text-[9px] text-[#555] tracking-[0.12em] uppercase">
              Sesión activa
            </div>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full h-9 rounded-lg border border-border text-[12px] text-text-muted hover:text-state-danger hover:border-state-danger/40 hover:bg-state-danger/10 flex items-center justify-center gap-2 transition-colors"
          >
            <Icon name="external" size={12} /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
