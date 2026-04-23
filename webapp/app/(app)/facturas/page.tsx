"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getFacturas,
  getLineasFactura,
  eliminarFactura,
  getConfigValue,
} from "@/lib/supabase";
import type { Factura } from "@/lib/types";

type FacturaConTotal = Factura & {
  clientes: { nombre: string } | null;
  total_calc: number;
};

function parseFecha(fecha: string) {
  try {
    return new Date(fecha).toLocaleDateString("es-ES");
  } catch {
    return fecha;
  }
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<FacturaConTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [ivaPct, setIvaPct] = useState(21);

  const load = async () => {
    setLoading(true);
    const [iva, list] = await Promise.all([
      getConfigValue("iva_porcentaje"),
      getFacturas(),
    ]);
    const ivaNum = parseFloat(iva || "21");
    setIvaPct(ivaNum);

    // For each factura, fetch its lines to calculate total
    const withTotals = await Promise.all(
      list.map(async (f) => {
        const lineas = await getLineasFactura(f.id);
        const base =
          lineas.reduce((s, l) => s + l.unidades * l.precio_unitario, 0) -
          (f.adelanto_importe || 0);
        const total = base * (1 + ivaNum / 100);
        return { ...f, total_calc: total };
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

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta factura? Esta acción no se puede deshacer."))
      return;
    await eliminarFactura(id);
    load();
  };

  // Stats
  const totalFacturado = facturas.reduce((s, f) => s + f.total_calc, 0);

  return (
    <div className="min-h-screen">
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              FINANZAS · FACTURACIÓN
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Facturas
            </h1>
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="text-text num">{facturas.length}</span> facturas
              {" · "}
              <span className="text-gold num">
                {totalFacturado.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {" €"}
              </span>{" "}
              facturado
            </p>
          </div>
        </div>
      </section>

      <section className="px-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-[540px] flex items-center h-11 rounded-[10px] bg-surface-1 border border-border px-4 hover:border-[#3a3a3a] transition">
            <Icon name="search" size={15} className="text-text-muted mr-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nº, cliente o proyecto..."
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

      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[110px]">
                  Nº FACTURA
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  CLIENTE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  PROYECTO
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[110px]">
                  FECHA
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[140px]">
                  TOTAL c/ IVA
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">
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
                    <td className="px-3 py-3 text-[13px] text-text">
                      {f.clientes?.nombre || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">
                      {f.proyecto || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted num">
                      {parseFecha(f.fecha)}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-text font-semibold text-right num">
                      {f.total_calc.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {" €"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Editar"
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2"
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          title="Eliminar"
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-state-danger hover:bg-surface-2"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#555] mt-3">
          IVA aplicado: {ivaPct}%. El editor de facturas se implementará en la
          siguiente fase.
        </p>
      </section>
    </div>
  );
}
