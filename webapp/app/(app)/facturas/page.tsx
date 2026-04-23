"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getFacturas,
  getLineasFactura,
  eliminarFactura,
  getConfigValue,
  getFactura,
} from "@/lib/supabase";
import type { Factura, LineaFactura } from "@/lib/types";
import { colorFromName, initials } from "@/lib/avatar";

type FacturaConTotal = Factura & {
  clientes: { nombre: string } | null;
  total_base: number;
  total_iva: number;
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

// ---------- Preview Modal ----------
function PreviewModal({
  factura,
  onClose,
  ivaPct,
}: {
  factura: FacturaConTotal;
  onClose: () => void;
  ivaPct: number;
}) {
  const [lineas, setLineas] = useState<LineaFactura[]>([]);
  const [detalle, setDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLineasFactura(factura.id), getFactura(factura.id)]).then(
      ([ls, d]) => {
        setLineas(ls);
        setDetalle(d);
        setLoading(false);
      }
    );
  }, [factura.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const base = lineas.reduce((s, l) => s + l.unidades * l.precio_unitario, 0);
  const adelanto = factura.adelanto_importe || 0;
  const subtotal = base - adelanto;
  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[760px] max-w-full max-h-[90vh] rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden flex flex-col">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              VISTA PREVIA · FACTURA
            </div>
            <div className="text-[16px] font-semibold text-text mt-0.5">
              {factura.numero_factura}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              title="Próximamente"
              className="h-9 px-3 rounded-lg border border-border text-[12px] text-text-muted opacity-60 cursor-not-allowed flex items-center gap-1.5"
            >
              <Icon name="download" size={13} /> PDF
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>

        {/* Body — factura layout */}
        <div className="relative flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="text-center py-20 text-text-muted">Cargando...</div>
          ) : (
            <>
              {/* Header de la factura */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="gold-grad text-[28px] font-bold tracking-[0.05em]">
                    SHIBBISHOP
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">
                    Manager
                  </div>
                </div>
                <div className="text-right text-[11px] text-text-muted leading-relaxed">
                  <div className="text-text font-semibold text-[13px]">
                    CAESPAN ARGUMENT S.L.
                  </div>
                  <div>Camino de Malatones Nº 54.</div>
                  <div>28140 Fuente El Saz. Madrid</div>
                  <div>B-86423472</div>
                </div>
              </div>

              {/* Datos factura */}
              <div className="border-t border-border pt-4 mb-6">
                <div className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-4 text-[12px]">
                  <div className="mono text-text-muted tracking-[0.15em]">
                    FACTURA Nº:
                  </div>
                  <div className="font-semibold text-text">
                    {factura.numero_factura}
                  </div>
                  <div className="mono text-text-muted tracking-[0.15em]">
                    FECHA:
                  </div>
                  <div className="text-text">{parseFecha(factura.fecha)}</div>
                  <div className="mono text-text-muted tracking-[0.15em]">
                    CLIENTE:
                  </div>
                  <div className="font-semibold text-text">
                    {detalle?.clientes?.nombre || "—"}
                  </div>
                  {detalle?.clientes?.direccion && (
                    <>
                      <div className="mono text-text-muted tracking-[0.15em]">
                        DIRECCIÓN:
                      </div>
                      <div className="text-text-muted">
                        {detalle.clientes.direccion}
                      </div>
                    </>
                  )}
                  {detalle?.clientes?.nif_cif && (
                    <>
                      <div className="mono text-text-muted tracking-[0.15em]">
                        C.I.F./N.I.F:
                      </div>
                      <div className="text-text-muted">
                        {detalle.clientes.nif_cif}
                      </div>
                    </>
                  )}
                  {factura.proyecto && (
                    <>
                      <div className="mono text-text-muted tracking-[0.15em]">
                        PROYECTO:
                      </div>
                      <div className="text-text-muted">{factura.proyecto}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Líneas */}
              <div className="border-t-2 border-border">
                <div className="grid grid-cols-[1fr_70px_90px_110px] gap-3 py-2 border-b border-border text-[10px] mono tracking-[0.15em] text-text-muted">
                  <div>CONCEPTO</div>
                  <div className="text-right">UDS</div>
                  <div className="text-right">PX</div>
                  <div className="text-right">TOTAL</div>
                </div>
                {lineas.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[1fr_70px_90px_110px] gap-3 py-3 border-b border-border/50 text-[12px]"
                  >
                    <div className="text-text">
                      {l.es_porte ? (
                        <span className="mono text-[10px] text-gold mr-2">
                          PORTE
                        </span>
                      ) : null}
                      {l.concepto}
                      {l.descripcion && (
                        <div className="text-text-muted text-[11px]">
                          {l.descripcion}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-text-muted num">
                      {l.unidades}
                    </div>
                    <div className="text-right text-text-muted num">
                      {fmtMoney(l.precio_unitario)}
                    </div>
                    <div className="text-right text-text font-medium num">
                      {fmtMoney(l.unidades * l.precio_unitario)}
                    </div>
                  </div>
                ))}

                {adelanto > 0 && (
                  <div className="grid grid-cols-[1fr_70px_90px_110px] gap-3 py-3 border-b border-border/50 text-[12px]">
                    <div className="text-text">
                      {factura.adelanto_descripcion || "Adelanto"}
                    </div>
                    <div className="text-right text-text-muted">—</div>
                    <div className="text-right text-text-muted">—</div>
                    <div className="text-right text-state-danger num">
                      -{fmtMoney(adelanto)}
                    </div>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="flex justify-end mt-6">
                <div className="w-[300px] border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 py-2 px-4 border-b border-border text-[12px]">
                    <span className="text-text-muted">Total Base</span>
                    <span className="text-right text-text num">
                      {fmtMoney(subtotal)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 py-2 px-4 border-b border-border text-[12px]">
                    <span className="text-text-muted">I.V.A {ivaPct}%</span>
                    <span className="text-right text-text num">
                      {fmtMoney(iva)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 py-3 px-4 bg-gold/10 text-[13px] font-semibold">
                    <span className="text-gold">TOTAL</span>
                    <span className="text-right text-gold num">
                      {fmtMoney(total)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Stat Card ----------
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "success" | "warning";
}) {
  const color =
    accent === "gold"
      ? "text-gold"
      : accent === "success"
      ? "text-[#6FBF8E]"
      : "text-text";
  const bg =
    accent === "gold"
      ? "bg-gold/5 border-gold/20"
      : "bg-surface-1 border-border";
  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="mono text-[10px] tracking-[0.2em] text-text-muted mb-2">
        {label}
      </div>
      <div className={`text-[28px] font-semibold num ${color}`}>{value}</div>
    </div>
  );
}

// ---------- Main Page ----------
export default function FacturasPage() {
  const [facturas, setFacturas] = useState<FacturaConTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [ivaPct, setIvaPct] = useState(21);
  const [previewing, setPreviewing] = useState<FacturaConTotal | null>(null);

  const load = async () => {
    setLoading(true);
    const [iva, list] = await Promise.all([
      getConfigValue("iva_porcentaje"),
      getFacturas(),
    ]);
    const ivaNum = parseFloat(iva || "21");
    setIvaPct(ivaNum);

    const withTotals = await Promise.all(
      list.map(async (f) => {
        const lineas = await getLineasFactura(f.id);
        const base =
          lineas.reduce((s, l) => s + l.unidades * l.precio_unitario, 0) -
          (f.adelanto_importe || 0);
        const iva = base * (ivaNum / 100);
        return { ...f, total_base: base, total_iva: base + iva };
      })
    );
    setFacturas(withTotals);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return facturas;
    const s = q.toLowerCase();
    return facturas.filter(
      (f) =>
        f.numero_factura.toLowerCase().includes(s) ||
        (f.clientes?.nombre || "").toLowerCase().includes(s) ||
        (f.proyecto || "").toLowerCase().includes(s)
    );
  }, [facturas, q]);

  const toggleEstado = async (f: FacturaConTotal) => {
    const newEstado = (f as any).estado === "Pagada" ? "Pendiente" : "Pagada";
    const { createClient } = await import("@/utils/supabase/client");
    const sb = createClient();
    await sb.from("facturas").update({ estado: newEstado }).eq("id", f.id);
    setFacturas((prev) =>
      prev.map((fac) =>
        fac.id === f.id ? { ...fac, estado: newEstado } as any : fac
      )
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta factura? Esta acción no se puede deshacer."))
      return;
    await eliminarFactura(id);
    load();
  };

  const totalFacturado = facturas.reduce((s, f) => s + f.total_iva, 0);
  const totalBase = facturas.reduce((s, f) => s + f.total_base, 0);
  const totalIva = totalFacturado - totalBase;

  return (
    <div className="min-h-screen">
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              FACTURACIÓN · LISTADO
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Facturas
            </h1>
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="text-text num">{facturas.length}</span> facturas
              emitidas
            </p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="px-10 pb-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="TOTAL FACTURADO (c/ IVA)"
            value={fmtMoney(totalFacturado)}
            accent="gold"
          />
          <StatCard
            label="BASE IMPONIBLE"
            value={fmtMoney(totalBase)}
            accent="success"
          />
          <StatCard label={`I.V.A ${ivaPct}%`} value={fmtMoney(totalIva)} />
        </div>
      </section>

      {/* Search */}
      <section className="px-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-[540px] flex items-center h-11 rounded-[10px] bg-surface-1 border border-border px-4 hover:border-[#3a3a3a] transition">
            <Icon name="search" size={15} className="text-text-muted mr-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por cliente, Nº factura o proyecto..."
              className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-text placeholder:text-[#555]"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="mono text-[10px] tracking-[0.12em] text-[#555] hover:text-text"
              >
                LIMPIAR
              </button>
            )}
          </div>
          <div className="mono text-[11px] text-[#555]">
            {filtered.length}{" "}
            {filtered.length === 1 ? "resultado" : "resultados"}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="px-10 pb-10">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[140px]">
                  Nº FACTURA
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  CLIENTE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  PROYECTO
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                  FECHA
                </th>
                <th className="px-3 py-3.5 text-center mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                  ESTADO
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[140px]">
                  TOTAL
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[170px]">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-muted">
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-muted">
                    No se encontraron facturas.
                  </td>
                </tr>
              ) : (
                filtered.map((f, i) => (
                  <tr
                    key={f.id}
                    className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${
                      i % 2 === 0 ? "bg-surface-1" : "bg-[#0D0D0D]"
                    }`}
                  >
                    <td className="pl-6 pr-3 py-3 mono text-[13px] text-gold font-medium">
                      {f.numero_factura}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-7 w-7 rounded-lg grid place-items-center text-[10px] font-bold shrink-0"
                          style={{
                            background: colorFromName(
                              f.clientes?.nombre || ""
                            ).bg,
                            color: colorFromName(f.clientes?.nombre || "").fg,
                          }}
                        >
                          {initials(f.clientes?.nombre || "—")}
                        </div>
                        <span className="text-[13px] text-text">
                          {f.clientes?.nombre || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted truncate max-w-[220px]">
                      {f.proyecto || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted num">
                      {parseFecha(f.fecha)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => toggleEstado(f)}
                        className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold transition ${
                          (f as any).estado === "Pagada"
                            ? "bg-state-success/15 text-[#6FBF8E] border border-state-success/30"
                            : "bg-[#E9C46A]/15 text-[#E9C46A] border border-[#E9C46A]/30"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            (f as any).estado === "Pagada"
                              ? "bg-[#6FBF8E]"
                              : "bg-[#E9C46A]"
                          }`}
                        />
                        {(f as any).estado || "Pendiente"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-text font-semibold text-right num">
                      {fmtMoney(f.total_iva)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewing(f)}
                          title="Vista previa"
                          className="h-8 w-8 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2"
                        >
                          <Icon name="eye" size={14} />
                        </button>
                        <button
                          disabled
                          title="Descargar PDF (próximamente)"
                          className="h-8 w-8 grid place-items-center rounded-md text-text-muted opacity-40 cursor-not-allowed"
                        >
                          <Icon name="download" size={14} />
                        </button>
                        <button
                          disabled
                          title="Editar (próximamente)"
                          className="h-8 w-8 grid place-items-center rounded-md text-text-muted opacity-40 cursor-not-allowed"
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          title="Eliminar"
                          className="h-8 w-8 grid place-items-center rounded-md text-text-muted hover:text-state-danger hover:bg-surface-2"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {previewing && (
        <PreviewModal
          factura={previewing}
          onClose={() => setPreviewing(null)}
          ivaPct={ivaPct}
        />
      )}
    </div>
  );
}
