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
  estado?: string;
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

// ---------- Status Pill ----------
function StatusPill({
  estado,
  onToggle,
}: {
  estado: string;
  onToggle: () => void;
}) {
  const isPagada = estado === "Pagada";
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-full border h-6 px-2.5 text-[11px] font-medium whitespace-nowrap transition hover:opacity-80"
      style={
        isPagada
          ? {
              background: "rgba(45,106,79,0.15)",
              color: "#6FBF8E",
              borderColor: "rgba(45,106,79,0.42)",
            }
          : {
              background: "rgba(250,197,28,0.10)",
              color: "#FAC51C",
              borderColor: "rgba(250,197,28,0.35)",
            }
      }
    >
      <Icon name={isPagada ? "check-circle" : "clock"} size={11} stroke={2} />
      {isPagada ? "Pagada" : "Pendiente"}
    </button>
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

        <div className="relative flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="text-center py-20 text-text-muted">Cargando...</div>
          ) : (
            <>
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
    setFacturas(withTotals as any);
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
    const newEstado = f.estado === "Pagada" ? "Pendiente" : "Pagada";
    const { createClient } = await import("@/utils/supabase/client");
    const sb = createClient();
    await sb.from("facturas").update({ estado: newEstado }).eq("id", f.id);
    setFacturas((prev) =>
      prev.map((fac) => (fac.id === f.id ? { ...fac, estado: newEstado } : fac))
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta factura? Esta acción no se puede deshacer."))
      return;
    await eliminarFactura(id);
    load();
  };

  const totalFacturado = facturas.reduce((s, f) => s + f.total_iva, 0);
  const pagadas = facturas.filter((f) => f.estado === "Pagada");
  const pendientes = facturas.filter((f) => f.estado !== "Pagada");
  const cobrado = pagadas.reduce((s, f) => s + f.total_iva, 0);
  const pendienteCobro = pendientes.reduce((s, f) => s + f.total_iva, 0);
  const totalShown = filtered.reduce((s, f) => s + f.total_iva, 0);

  return (
    <div className="min-h-screen">
      {/* Page header */}
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
              <span className="text-text font-medium">{facturas.length}</span>{" "}
              facturas ·
              <span className="text-[#6FBF8E] font-medium">
                {" "}
                {pagadas.length} pagadas
              </span>{" "}
              ·
              <span className="text-gold font-medium">
                {" "}
                {pendientes.length} pendientes
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 px-4 rounded-lg border border-border text-[13px] text-text hover:bg-surface-1 hover:border-[#3a3a3a] flex items-center gap-2">
              <Icon name="download" size={14} /> Exportar
            </button>
            <button className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light">
              <Icon name="plus" size={14} stroke={2.4} /> Nueva Factura
            </button>
          </div>
        </div>
      </section>

      {/* Summary strip */}
      <section className="px-10 pb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-surface-1 p-5">
            <div className="mono text-[10px] tracking-[0.18em] text-text-muted">
              TOTAL FACTURADO
            </div>
            <div className="num text-[30px] font-semibold tracking-tight mt-2">
              {fmtMoney(totalFacturado)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface-1 p-5">
            <div className="mono text-[10px] tracking-[0.18em] text-[#6FBF8E]">
              COBRADO
            </div>
            <div className="num text-[30px] font-semibold tracking-tight mt-2 text-[#6FBF8E]">
              {fmtMoney(cobrado)}
            </div>
          </div>
          <div className="rounded-xl border border-gold/30 bg-gradient-to-b from-[#1a1405] to-surface-1 p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
            <div className="mono text-[10px] tracking-[0.18em] text-gold">
              PENDIENTE DE COBRO
            </div>
            <div className="num text-[30px] font-semibold tracking-tight mt-2 gold-grad">
              {fmtMoney(pendienteCobro)}
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="px-10 pb-10">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-2">
            <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3 w-96">
              <Icon name="search" size={15} className="text-[#555] mr-2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por cliente, Nº factura o proyecto…"
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[#555]"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="text-[#555] hover:text-text-muted"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
            <div className="flex-1" />
            <span className="mono text-[11px] text-[#555]">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} ·{" "}
              <span className="text-gold">{fmtMoney(totalShown)}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0E0E0E] border-b border-border">
                <tr>
                  <th className="text-left pl-6 pr-3 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    Nº FACTURA
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
                    TOTAL
                  </th>
                  <th className="text-right px-6 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-text-muted"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-10 py-20 text-center">
                      <div className="mx-auto h-10 w-10 rounded-lg border border-border grid place-items-center mb-3">
                        <Icon name="search" size={14} className="text-[#555]" />
                      </div>
                      <div className="text-sm text-text">Sin resultados</div>
                      <div className="text-xs text-text-muted mt-1">
                        Prueba con otro nombre de cliente o número de factura.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((f, i) => (
                    <tr
                      key={f.id}
                      className={`border-b border-surface-2 last:border-b-0 hover:bg-surface-2 transition-colors ${
                        i % 2 === 1 ? "bg-[#141414]" : "bg-surface-1"
                      }`}
                    >
                      <td className="pl-6 pr-3 py-4 mono text-[12px] text-text">
                        {f.numero_factura}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-lg grid place-items-center text-[11px] font-semibold flex-shrink-0"
                            style={{
                              background: `${colorFromName(f.clientes?.nombre || "").bg}20`,
                              border: `1px solid ${colorFromName(f.clientes?.nombre || "").bg}50`,
                              color: colorFromName(f.clientes?.nombre || "").bg,
                            }}
                          >
                            {initials(f.clientes?.nombre || "—")}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] text-text truncate">
                              {f.clientes?.nombre || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-text-muted max-w-[280px] truncate">
                        {f.proyecto || "—"}
                      </td>
                      <td className="px-4 py-4 mono text-[12px] text-text-muted whitespace-nowrap">
                        {parseFecha(f.fecha)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill
                          estado={f.estado || "Pendiente"}
                          onToggle={() => toggleEstado(f)}
                        />
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <span className="num text-[14px] font-semibold text-text">
                          {fmtMoney(f.total_iva)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewing(f)}
                            title="Ver"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2"
                          >
                            <Icon name="eye" size={13} />
                          </button>
                          <button
                            title="Descargar PDF"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2 opacity-50 cursor-not-allowed"
                            disabled
                          >
                            <Icon name="download" size={13} />
                          </button>
                          <a
                            href={`/facturas/${f.id}`}
                            title="Editar"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2 hover:border-[#3a3a3a]"
                          >
                            <Icon name="edit" size={13} />
                          </a>
                          <button
                            onClick={() => handleDelete(f.id)}
                            title="Eliminar"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-[#E74C3C]/80 hover:text-[#F39C8E] hover:bg-state-danger/10 hover:border-state-danger/40"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-[#0E0E0E] border-t border-border">
                    <td
                      colSpan={5}
                      className="pl-6 pr-4 py-3.5 mono text-[10px] tracking-[0.18em] text-text-muted"
                    >
                      TOTAL MOSTRADO
                    </td>
                    <td className="px-4 py-3.5 text-right num text-[15px] font-semibold gold-grad whitespace-nowrap">
                      {fmtMoney(totalShown)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
