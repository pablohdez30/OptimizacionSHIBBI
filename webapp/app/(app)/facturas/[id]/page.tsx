"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import {
  getFactura,
  getLineasFactura,
  actualizarFactura,
  agregarLineaFactura,
  actualizarLineaFactura,
  eliminarLineaFactura,
  getClientes,
  getConfigValue,
} from "@/lib/supabase";
import type { Cliente, LineaFactura } from "@/lib/types";
import { exportFactura } from "@/lib/export";
import ExportResultModal from "@/components/ExportResultModal";
import { toast } from "sonner";

function fmt(n: number) {
  return (
    n.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function parseNum(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

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

// Línea local (con estado de guardado)
type LineaLocal = {
  id: number | null; // null = nueva, no guardada
  concepto: string;
  descripcion: string;
  unidades: string;
  precio_unitario: string;
  es_porte: number;
  orden: number;
  _dirty?: boolean;
  _new?: boolean;
};

export default function EditorFacturaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const facturaId = parseInt(params.id);

  const [factura, setFactura] = useState<any>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [lines, setLines] = useState<LineaLocal[]>([]);
  const [ivaPct, setIvaPct] = useState(21);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state (datos factura)
  const [info, setInfo] = useState({
    cliente_id: 0,
    numero_factura: "",
    fecha: "",
    proyecto: "",
  });
  const [advance, setAdvance] = useState({
    enabled: false,
    descripcion: "",
    importe: "0",
  });

  // Track dirty
  const [dirty, setDirty] = useState(false);
  const [exportResult, setExportResult] = useState<{
    archivos: string[];
    errores: string[];
  } | null>(null);

  const load = async () => {
    setLoading(true);
    const [f, cs, iva] = await Promise.all([
      getFactura(facturaId),
      getClientes(),
      getConfigValue("iva_porcentaje"),
    ]);
    setFactura(f);
    setClientes(cs);
    setIvaPct(parseFloat(iva || "21"));
    setInfo({
      cliente_id: f.cliente_id,
      numero_factura: f.numero_factura,
      fecha: f.fecha,
      proyecto: f.proyecto || "",
    });
    setAdvance({
      enabled: (f.adelanto_importe || 0) > 0,
      descripcion: f.adelanto_descripcion || "",
      importe: String(f.adelanto_importe || 0),
    });

    const ls = await getLineasFactura(facturaId);
    setLines(
      ls.map((l) => ({
        id: l.id,
        concepto: l.concepto,
        descripcion: l.descripcion || "",
        unidades: String(l.unidades),
        precio_unitario: String(l.precio_unitario),
        es_porte: l.es_porte,
        orden: l.orden,
      }))
    );
    setDirty(false);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [facturaId]);

  const updateLine = (i: number, patch: Partial<LineaLocal>) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...patch, _dirty: true } : l))
    );
    setDirty(true);
  };

  const deleteLine = (i: number) => {
    const l = lines[i];
    if (l.id) {
      // marcar para borrar al guardar → lo borramos directamente
      eliminarLineaFactura(l.id);
    }
    setLines((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const addLine = (es_porte = 0) => {
    setLines((prev) => [
      ...prev,
      {
        id: null,
        concepto: es_porte ? "Porte / transporte" : "",
        descripcion: "",
        unidades: "1",
        precio_unitario: "0",
        es_porte,
        orden: prev.length,
        _new: true,
        _dirty: true,
      },
    ]);
    setDirty(true);
  };

  const totals = useMemo(() => {
    const base = lines.reduce(
      (s, l) => s + parseNum(l.unidades) * parseNum(l.precio_unitario),
      0
    );
    const ivaImporte = base * (ivaPct / 100);
    const subtotal = base + ivaImporte;
    const adv = advance.enabled ? parseNum(advance.importe) : 0;
    return {
      base,
      iva: ivaImporte,
      subtotal,
      advance: adv,
      total: subtotal - adv,
    };
  }, [lines, advance, ivaPct]);

  const confirmarEdicion = () => {
    return confirm(
      "Estás editando una factura que ya existía.\n\n¿Seguro que quieres guardar los cambios sobre ella?"
    );
  };

  const handleSave = async () => {
    if (!info.cliente_id) {
      toast.info("Selecciona un cliente");
      return;
    }
    if (!confirmarEdicion()) return;

    setSaving(true);
    try {
      // Factura datos
      await actualizarFactura(facturaId, {
        cliente_id: info.cliente_id,
        numero_factura: info.numero_factura.trim(),
        fecha: info.fecha,
        proyecto: info.proyecto,
        adelanto_descripcion: advance.enabled ? advance.descripcion : "",
        adelanto_importe: advance.enabled ? parseNum(advance.importe) : 0,
      } as any);

      // Líneas
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const payload = {
          factura_id: facturaId,
          concepto: l.concepto.trim() || `Línea ${i + 1}`,
          descripcion: l.descripcion,
          unidades: parseNum(l.unidades),
          precio_unitario: parseNum(l.precio_unitario),
          es_porte: l.es_porte,
          orden: i,
        };

        if (l.id === null) {
          const created = await agregarLineaFactura(payload as any);
          l.id = created.id;
          l._new = false;
          l._dirty = false;
        } else if (l._dirty) {
          await actualizarLineaFactura(l.id, payload as any);
          l._dirty = false;
        }
      }
      setDirty(false);
      await load();
    } catch (e) {
      toast.error("Error al guardar la factura", {
        description: (e as Error).message,
      });
    }
    setSaving(false);
  };

  const handleExport = async () => {
    if (dirty) {
      if (!confirm("Tienes cambios sin guardar. ¿Guardar antes de exportar?")) return;
      await handleSave();
    }
    try {
      const res = await exportFactura(facturaId);
      setExportResult(res);
    } catch (e) {
      setExportResult({ archivos: [], errores: [(e as Error).message] });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Cargando factura...
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Factura no encontrada.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              EDICIÓN · FACTURA
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Factura{" "}
              <span className="gold-grad">{factura.numero_factura}</span>
            </h1>
            <p className="mt-3 text-[14px] text-text-muted">
              Emitida el {parseFecha(factura.fecha)} ·{" "}
              <span className="text-text">{lines.length} líneas</span>
              {factura.presupuesto_id && (
                <>
                  {" "}· vinculada al presupuesto{" "}
                  <span className="mono text-gold">
                    #{factura.presupuesto_id}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="mono text-[11px] text-gold flex items-center gap-1.5 pr-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                CAMBIOS SIN GUARDAR
              </span>
            )}
            <Link
              href="/facturas"
              className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text hover:bg-surface-1 hover:border-[#3a3a3a] flex items-center gap-2"
            >
              <Icon name="chevron-left" size={14} /> Volver
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="h-10 px-4 rounded-lg border border-state-success/50 bg-state-success/15 text-[#6FBF8E] text-[13px] font-medium hover:bg-state-success/25 hover:border-state-success flex items-center gap-2 disabled:opacity-40"
            >
              <Icon name="save" size={14} /> {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={handleExport}
              className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
            >
              <Icon name="download" size={14} stroke={2.2} /> Exportar Factura
            </button>
          </div>
        </div>
      </section>

      {/* 01 Datos */}
      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
            <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
              01 · DATOS DE LA FACTURA
            </span>
            <div className="flex-1 h-px bg-surface-2" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-text">
                    Cliente <span className="text-gold">*</span>
                  </span>
                </div>
                <select
                  value={info.cliente_id}
                  onChange={(e) => {
                    setInfo({ ...info, cliente_id: parseInt(e.target.value) });
                    setDirty(true);
                  }}
                  className="ss-input w-full h-10 text-[13px]"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-text">
                    Nº Factura <span className="text-gold">*</span>
                  </span>
                </div>
                <input
                  value={info.numero_factura}
                  onChange={(e) => {
                    setInfo({ ...info, numero_factura: e.target.value });
                    setDirty(true);
                  }}
                  placeholder="26-001"
                  className="ss-input w-full h-10 text-[13px]"
                />
              </div>

              <div className="col-span-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-text">
                    Fecha emisión <span className="text-gold">*</span>
                  </span>
                </div>
                <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3">
                  <Icon name="calendar" size={14} className="mr-2 text-[#555]" />
                  <input
                    type="date"
                    value={info.fecha}
                    onChange={(e) => {
                      setInfo({ ...info, fecha: e.target.value });
                      setDirty(true);
                    }}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="col-span-12 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-text">
                    Proyecto <span className="text-gold">*</span>
                  </span>
                </div>
                <input
                  value={info.proyecto}
                  onChange={(e) => {
                    setInfo({ ...info, proyecto: e.target.value });
                    setDirty(true);
                  }}
                  placeholder="Nombre del proyecto facturado"
                  className="ss-input w-full h-10 text-[13px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Líneas */}
      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
            <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
              02 · LÍNEAS DE FACTURA
            </span>
            <div className="flex-1 h-px bg-surface-2" />
            <span className="mono text-[10px] text-[#555]">
              {lines.length} líneas
            </span>
          </div>

          <div className="px-2 pt-2">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    CONCEPTO
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium w-[100px]">
                    UNIDADES
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium w-[140px]">
                    PX UNITARIO
                  </th>
                  <th className="px-3 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium text-right w-[140px]">
                    TOTAL
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      Sin líneas. Añade la primera abajo.
                    </td>
                  </tr>
                ) : (
                  lines.map((l, i) => {
                    const total =
                      parseNum(l.unidades) * parseNum(l.precio_unitario);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-surface-2 last:border-b-0 hover:bg-surface-2/60 transition-colors ${
                          i % 2 === 1 ? "bg-[#0E0E0E]" : ""
                        }`}
                      >
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            {l.es_porte ? (
                              <span className="inline-flex items-center gap-1 text-[10px] mono tracking-[0.12em] uppercase px-1.5 h-5 rounded border border-gold/30 text-gold bg-gold/10 flex-shrink-0">
                                <Icon name="truck" size={10} /> PORTE
                              </span>
                            ) : null}
                            <input
                              value={l.concepto}
                              onChange={(e) =>
                                updateLine(i, { concepto: e.target.value })
                              }
                              placeholder="Describe el concepto facturado…"
                              className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text placeholder:text-[#555] py-1"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center h-9 rounded-lg bg-[#0E0E0E] border border-border px-2.5">
                            <input
                              value={l.unidades}
                              onChange={(e) =>
                                updateLine(i, { unidades: e.target.value })
                              }
                              className="flex-1 min-w-0 bg-transparent outline-none num text-[12px] text-text text-right"
                            />
                            <span className="ml-1 text-[#555] text-[10px] mono">
                              ud
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center h-9 rounded-lg bg-[#0E0E0E] border border-border px-2.5">
                            <input
                              value={l.precio_unitario}
                              onChange={(e) =>
                                updateLine(i, {
                                  precio_unitario: e.target.value,
                                })
                              }
                              className="flex-1 min-w-0 bg-transparent outline-none num text-[12px] text-text text-right"
                            />
                            <span className="ml-1 text-[#555] text-[10px] mono">
                              €
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="num text-[13px] font-semibold text-text">
                            {fmt(total)}
                          </span>
                        </td>
                        <td className="pr-3 pl-1 py-2.5">
                          <button
                            onClick={() => deleteLine(i)}
                            className="h-7 w-7 grid place-items-center rounded-md text-[#555] hover:text-state-danger hover:bg-state-danger/10"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => addLine(0)}
              className="flex-1 h-10 rounded-lg border border-dashed border-border text-[12px] text-text-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 flex items-center justify-center gap-1.5 transition"
            >
              <Icon name="plus" size={13} stroke={2.2} /> Añadir línea
            </button>
            <button
              onClick={() => addLine(1)}
              className="h-10 px-4 rounded-lg border border-dashed border-gold/30 bg-gold/[0.03] text-[12px] text-gold hover:bg-gold/10 hover:border-gold/60 flex items-center gap-1.5 transition"
            >
              <Icon name="truck" size={13} /> Añadir Porte
            </button>
          </div>
        </div>
      </section>

      {/* 03 Adelanto + 04 Resumen */}
      <section className="px-10 pb-10 grid grid-cols-12 gap-5">
        {/* Adelanto */}
        <div className="col-span-5">
          <div
            className={`rounded-xl border overflow-hidden transition ${
              advance.enabled ? "border-gold/30 bg-surface-1" : "border-border bg-surface-1"
            }`}
          >
            <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
              <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
                03 · ADELANTO
              </span>
              <div className="flex-1 h-px bg-surface-2" />
            </div>
            <div className="p-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="ss-check"
                  checked={advance.enabled}
                  onChange={(e) => {
                    setAdvance({ ...advance, enabled: e.target.checked });
                    setDirty(true);
                  }}
                />
                <div>
                  <div
                    className={`text-[13px] font-medium ${
                      advance.enabled ? "text-text" : "text-text-muted"
                    }`}
                  >
                    Incluir adelanto
                  </div>
                  <div className="text-[11px] text-[#555] mt-0.5">
                    Se descontará del total de la factura
                  </div>
                </div>
              </label>

              <div
                className={`mt-5 space-y-4 transition-opacity ${
                  advance.enabled ? "opacity-100" : "opacity-40 pointer-events-none"
                }`}
              >
                <div>
                  <label className="text-[12px] font-medium text-text mb-2 block">
                    Descripción del adelanto
                  </label>
                  <input
                    value={advance.descripcion}
                    onChange={(e) => {
                      setAdvance({ ...advance, descripcion: e.target.value });
                      setDirty(true);
                    }}
                    placeholder="Ej. Anticipo 30% al firmar presupuesto"
                    className="ss-input w-full h-10 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-text mb-2 block">
                    Importe
                  </label>
                  <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3">
                    <input
                      value={advance.importe}
                      onChange={(e) => {
                        setAdvance({ ...advance, importe: e.target.value });
                        setDirty(true);
                      }}
                      className="flex-1 min-w-0 bg-transparent outline-none num text-[13px] text-text text-right"
                    />
                    <span className="ml-2 text-text-muted text-[11px] mono">€</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-[#0E0E0E] px-3 py-2.5 flex items-start gap-2.5">
                  <Icon name="info" size={13} className="text-gold mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-text-muted leading-relaxed">
                    El adelanto queda reflejado como{" "}
                    <span className="text-text">línea negativa</span> en el PDF
                    del cliente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="col-span-7">
          <div className="rounded-xl border border-border bg-gradient-to-b from-[#1a1405] to-surface-1 overflow-hidden relative h-full">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold/8 blur-3xl pointer-events-none" />
            <div className="px-5 py-4 border-b border-gold/15 flex items-center gap-3 relative">
              <span className="mono text-[10px] tracking-[0.18em] text-gold">
                04 · RESUMEN
              </span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            <div className="p-8 relative">
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-text-muted">Base imponible</dt>
                  <dd className="num text-[17px] font-medium text-text">
                    {fmt(totals.base)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-text-muted">IVA ({ivaPct}%)</dt>
                  <dd className="num text-[17px] font-medium text-text">
                    {fmt(totals.iva)}
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <dt className="text-[12px] mono tracking-[0.12em] text-[#555] uppercase">
                    Subtotal c/IVA
                  </dt>
                  <dd className="num text-[14px] text-text-muted">
                    {fmt(totals.subtotal)}
                  </dd>
                </div>
                {advance.enabled && (
                  <div className="flex items-center justify-between">
                    <dt className="text-[13px] text-[#F39C8E] flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[9px] mono tracking-[0.12em] uppercase px-1.5 h-4 rounded border border-state-danger/30 text-[#F39C8E] bg-state-danger/10">
                        ADELANTO
                      </span>
                      A descontar
                    </dt>
                    <dd className="num text-[17px] font-medium text-[#F39C8E]">
                      − {fmt(totals.advance)}
                    </dd>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-4" />
                <div className="flex items-end justify-between">
                  <div>
                    <div className="mono text-[11px] tracking-[0.2em] text-gold">
                      TOTAL · A PAGAR
                    </div>
                    <div className="text-[11px] text-[#555] mt-1">
                      IVA incluido · en euros
                    </div>
                  </div>
                  <dd className="num text-[48px] leading-none font-semibold tracking-tight gold-grad">
                    {fmt(totals.total)}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 flex items-center gap-3 justify-end">
                <Link
                  href="/facturas"
                  className="h-10 px-4 rounded-lg border border-border text-[12px] text-text-muted hover:text-text hover:border-[#3a3a3a] flex items-center gap-2"
                >
                  <Icon name="eye" size={13} /> Ver en listado
                </Link>
                <button
                  onClick={handleExport}
                  className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
                >
                  <Icon name="download" size={14} stroke={2.2} /> Exportar Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {exportResult && (
        <ExportResultModal
          archivos={exportResult.archivos}
          errores={exportResult.errores}
          onClose={() => setExportResult(null)}
        />
      )}
    </div>
  );
}
