"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import {
  getPresupuestos,
  actualizarEstadoPresupuesto,
  eliminarPresupuesto,
  getTotalPresupuesto,
  getConfigValue,
  crearFacturaDesdePresupuesto,
} from "@/lib/supabase";
import type { Presupuesto } from "@/lib/types";
import { colorFromName, initials } from "@/lib/avatar";

const CIF_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "N", "P", "Q", "R", "S", "U", "V", "W"];
function kindFromNif(nif?: string | null): "Particular" | "Empresa" {
  if (!nif) return "Particular";
  return CIF_LETTERS.includes(nif.trim().charAt(0).toUpperCase()) ? "Empresa" : "Particular";
}

type PresupuestoRow = Presupuesto & {
  clientes: { nombre: string; nif_cif: string } | null;
  total_base: number;
  total_iva: number;
  clientKind: "Particular" | "Empresa";
};

function parseFecha(fecha: string) {
  try {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

function fmtMoney(v: number) {
  return (
    v.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

// Estados del backend Python → styles del design
const BADGE_STYLES: Record<string, { dot: string; bg: string; fg: string; bd: string }> = {
  Borrador: { dot: "#888888", bg: "rgba(136,136,136,0.10)", fg: "#C9C9C9", bd: "rgba(136,136,136,0.28)" },
  Enviado: { dot: "#3498DB", bg: "rgba(52,152,219,0.10)", fg: "#8EC5EA", bd: "rgba(52,152,219,0.32)" },
  Aceptado: { dot: "#4CAF7C", bg: "rgba(76,175,124,0.10)", fg: "#7FD4A3", bd: "rgba(76,175,124,0.32)" },
  Rechazado: { dot: "#E74C3C", bg: "rgba(231,76,60,0.10)", fg: "#F39C8E", bd: "rgba(231,76,60,0.35)" },
  "En producción": { dot: "#FAC51C", bg: "rgba(250,197,28,0.10)", fg: "#FAC51C", bd: "rgba(250,197,28,0.35)" },
  Entregado: { dot: "#2D6A4F", bg: "rgba(45,106,79,0.15)", fg: "#6FBF8E", bd: "rgba(45,106,79,0.42)" },
};
const STATUS_OPTIONS = [
  "Todos",
  "Borrador",
  "Enviado",
  "Aceptado",
  "Rechazado",
  "En producción",
  "Entregado",
];

function Badge({ estado }: { estado: string }) {
  const b = BADGE_STYLES[estado] || BADGE_STYLES.Borrador;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border font-medium h-6 px-2.5 text-[11px] whitespace-nowrap"
      style={{ background: b.bg, color: b.fg, borderColor: b.bd }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.dot }} />
      {estado}
    </span>
  );
}

// ---------- Estado dropdown (quick change) ----------
function EstadoDropdown({
  estado,
  onChange,
}: {
  estado: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const opts = [
    "Borrador",
    "Enviado",
    "Aceptado",
    "Rechazado",
    "En producción",
    "Entregado",
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center gap-1"
      >
        <Badge estado={estado} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-border bg-surface-1 shadow-2xl py-1 min-w-[150px]">
            {opts.map((o) => (
              <button
                key={o}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(o);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-2 flex items-center gap-2"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: BADGE_STYLES[o].dot }}
                />
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PresupuestosPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PresupuestoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [ivaPct, setIvaPct] = useState(21);
  const [creatingFactura, setCreatingFactura] = useState<number | null>(null);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    const [iva, list] = await Promise.all([
      getConfigValue("iva_porcentaje"),
      getPresupuestos(),
    ]);
    const ivaNum = parseFloat(iva || "21");
    setIvaPct(ivaNum);

    const withTotals = await Promise.all(
      list.map(async (p) => {
        const total_base = await getTotalPresupuesto(p.id);
        const total_iva = total_base * (1 + ivaNum / 100);
        return {
          ...p,
          total_base,
          total_iva,
          clientKind: kindFromNif(p.clientes?.nif_cif),
        } as PresupuestoRow;
      })
    );
    setRows(withTotals);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "Todos" && r.estado !== status) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !(
            (r.clientes?.nombre || "").toLowerCase().includes(q) ||
            r.numero_presupuesto.toLowerCase().includes(q) ||
            (r.proyecto || "").toLowerCase().includes(q)
          )
        )
          return false;
      }
      return true;
    });
  }, [rows, query, status]);

  const totalSum = useMemo(
    () => filtered.reduce((s, r) => s + r.total_iva, 0),
    [filtered]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggle = (id: number) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleAll = () => {
    const ids = pageData.map((r) => r.id);
    const allSel = ids.every((id) => selected.has(id));
    const n = new Set(selected);
    ids.forEach((id) => (allSel ? n.delete(id) : n.add(id)));
    setSelected(n);
  };
  const allChecked =
    pageData.length > 0 && pageData.every((r) => selected.has(r.id));

  const changeEstado = async (id: number, estado: string) => {
    await actualizarEstadoPresupuesto(id, estado);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este presupuesto? Esta acción no se puede deshacer.")) return;
    await eliminarPresupuesto(id);
    load();
  };

  const handleCrearFactura = async (presupuestoId: number, numero: string) => {
    if (
      !confirm(
        `¿Crear factura a partir del presupuesto ${numero}?\n\nSe generará una factura nueva con las líneas del presupuesto y podrás editarla después.`
      )
    )
      return;
    setCreatingFactura(presupuestoId);
    try {
      const fac = await crearFacturaDesdePresupuesto(presupuestoId);
      router.push(`/facturas/${fac.id}`);
    } catch (e) {
      alert("No se pudo crear la factura:\n" + (e as Error).message);
      setCreatingFactura(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              GESTIÓN · LISTADO
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Presupuestos
            </h1>
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="text-text font-medium">{rows.length}</span>{" "}
              presupuestos totales ·{" "}
              <span className="text-text font-medium">{filtered.length}</span>{" "}
              coinciden con los filtros · importe filtrado{" "}
              <span className="num text-gold font-semibold">
                {fmtMoney(totalSum)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 px-4 rounded-lg border border-border text-[13px] text-text hover:bg-surface-1 hover:border-[#3a3a3a] flex items-center gap-2">
              <Icon name="download" size={14} /> Exportar
            </button>
            <Link
              href="/nuevo-presupuesto"
              className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
            >
              <Icon name="plus" size={14} stroke={2.4} /> Nuevo Presupuesto
            </Link>
          </div>
        </div>
      </section>

      {/* Filters + Table */}
      <section className="px-10 pb-10">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-2 flex-wrap">
            <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3 w-80">
              <Icon name="search" size={15} className="text-[#555] mr-2" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar cliente, proyecto, Nº…"
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[#555]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[#555] hover:text-text-muted"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1 rounded-lg bg-[#0E0E0E] border border-border p-1">
              {STATUS_OPTIONS.map((s) => {
                const isActive = status === s;
                const dot = s === "Todos" ? null : BADGE_STYLES[s]?.dot;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      setPage(1);
                    }}
                    className={`h-8 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition ${
                      isActive
                        ? "bg-surface-2 text-text"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {dot && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: dot }}
                      />
                    )}
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            <span className="mono text-[11px] text-[#555]">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-5 py-2.5 bg-gold/5 border-b border-gold/20">
              <span className="text-[12px] text-gold font-medium">
                {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => setSelected(new Set())}
                className="text-text-muted hover:text-text"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0E0E0E] border-b border-border">
                <tr>
                  <th className="w-10 pl-5 pr-2 py-3">
                    <input
                      type="checkbox"
                      className="ss-check"
                      checked={allChecked}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left px-3 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    Nº PRESUPUESTO
                  </th>
                  <th className="text-left px-4 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    CLIENTE
                  </th>
                  <th className="text-left px-4 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    PROYECTO
                  </th>
                  <th className="text-left px-4 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    FECHA
                  </th>
                  <th className="text-left px-4 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    ESTADO
                  </th>
                  <th className="text-right px-4 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    TOTAL (IVA INCL.)
                  </th>
                  <th className="text-right px-4 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-text-muted">
                      Cargando...
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-10 py-20 text-center">
                      <div className="mx-auto h-10 w-10 rounded-lg border border-border grid place-items-center mb-3">
                        <Icon name="search" size={14} className="text-[#555]" />
                      </div>
                      <div className="text-sm text-text">Sin resultados</div>
                      <div className="text-xs text-text-muted mt-1">
                        Ajusta tu búsqueda o cambia el filtro de estado.
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageData.map((r, i) => {
                    const isSel = selected.has(r.id);
                    const iva = r.total_iva - r.total_base;
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-surface-2 last:border-b-0 hover:bg-surface-2 transition-colors ${
                          i % 2 === 1 ? "bg-[#141414]" : "bg-surface-1"
                        } ${isSel ? "!bg-gold/[0.04]" : ""}`}
                      >
                        <td className="pl-5 pr-2 py-4">
                          <input
                            type="checkbox"
                            className="ss-check"
                            checked={isSel}
                            onChange={() => toggle(r.id)}
                          />
                        </td>
                        <td className="px-3 py-4 mono text-[12px] text-text">
                          {r.numero_presupuesto}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-lg grid place-items-center text-[11px] font-semibold flex-shrink-0"
                              style={{
                                background: `${colorFromName(r.clientes?.nombre || "").bg}20`,
                                border: `1px solid ${colorFromName(r.clientes?.nombre || "").bg}50`,
                                color: colorFromName(r.clientes?.nombre || "").bg,
                              }}
                            >
                              {initials(r.clientes?.nombre || "—")}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] text-text truncate">
                                {r.clientes?.nombre || "—"}
                              </div>
                              <div className="mono text-[10px] text-[#555] tracking-[0.1em] uppercase">
                                {r.clientKind}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-text-muted max-w-[280px] truncate">
                          {r.proyecto || "—"}
                        </td>
                        <td className="px-4 py-4 mono text-[12px] text-text-muted whitespace-nowrap">
                          {parseFecha(r.fecha)}
                        </td>
                        <td className="px-4 py-4">
                          <EstadoDropdown
                            estado={r.estado}
                            onChange={(v) => changeEstado(r.id, v)}
                          />
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="num text-[13px] font-semibold text-text">
                            {fmtMoney(r.total_iva)}
                          </div>
                          <div className="num mono text-[10px] text-[#555] mt-0.5">
                            IVA {fmtMoney(iva)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.estado === "Entregado" && (
                              <button
                                title="Pedir reseña"
                                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-gold text-bg bg-gold hover:bg-gold-light text-[11px] font-medium"
                              >
                                <Icon name="star" size={13} /> Reseña
                              </button>
                            )}
                            {r.estado === "Aceptado" && (
                              <button
                                onClick={() =>
                                  handleCrearFactura(r.id, r.numero_presupuesto)
                                }
                                disabled={creatingFactura === r.id}
                                title="Crear factura"
                                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/60 text-[11px] font-medium disabled:opacity-50"
                              >
                                <Icon name="invoice" size={13} />
                                {creatingFactura === r.id ? "Creando…" : "Factura"}
                              </button>
                            )}
                            <Link
                              href={`/nuevo-presupuesto?id=${r.id}`}
                              title="Editar"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2 hover:border-[#3a3a3a]"
                            >
                              <Icon name="edit" size={13} />
                            </Link>
                            <button
                              title="Duplicar"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2 hover:border-[#3a3a3a]"
                            >
                              <Icon name="copy" size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              title="Eliminar"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-[#E74C3C]/80 hover:text-[#F39C8E] hover:bg-state-danger/10 hover:border-state-danger/40"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer + pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-2 bg-[#0E0E0E]">
            <span className="mono text-[11px] text-text-muted">
              MOSTRANDO{" "}
              {filtered.length === 0
                ? 0
                : (page - 1) * pageSize + 1}
              –{Math.min(page * pageSize, filtered.length)} DE {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 px-2 rounded-md text-[12px] text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-30 flex items-center gap-1"
              >
                <Icon name="chevron-left" size={13} /> Anterior
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                const n = i + 1;
                const isActive = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 grid place-items-center rounded-md text-[12px] ${
                      isActive
                        ? "bg-gold text-bg font-semibold"
                        : "text-text-muted hover:text-text hover:bg-surface-2"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="h-8 px-2 rounded-md text-[12px] text-text hover:bg-surface-2 disabled:opacity-30 flex items-center gap-1"
              >
                Siguiente <Icon name="chevron-right" size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
