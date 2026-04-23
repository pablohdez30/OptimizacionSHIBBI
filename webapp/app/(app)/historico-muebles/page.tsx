"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getHistoricoMuebles,
  getCategoriasMueble,
  getClientes,
} from "@/lib/supabase";
import type { CategoriaMueble, Cliente } from "@/lib/types";
import { colorFromName, initials } from "@/lib/avatar";

type HistoricoRow = {
  id: number;
  presupuesto_id: number | null;
  cliente_id: number | null;
  categoria_mueble_id: number | null;
  nombre: string;
  descripcion: string;
  fecha: string;
  precio_unitario: number;
  cantidad: number;
  categorias_mueble: { nombre: string } | null;
  clientes: { nombre: string } | null;
  presupuestos: { numero_presupuesto: string } | null;
};

// Icono por categoría de mueble
function catIcon(nombre: string | null | undefined) {
  switch ((nombre || "").toLowerCase()) {
    case "mesa":
      return "archive";
    case "mueble":
      return "archive";
    case "estantería":
    case "estanteria":
      return "archive";
    case "escultura":
      return "tag";
    case "consola":
      return "archive";
    case "cerramiento":
      return "archive";
    case "espejo":
      return "eye";
    default:
      return "archive";
  }
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

function fmtMoney(v: number) {
  return (
    v.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

export default function HistoricoMueblesPage() {
  const [rows, setRows] = useState<HistoricoRow[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMueble[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [catId, setCatId] = useState<number | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    Promise.all([getCategoriasMueble(), getClientes()]).then(([c, cl]) => {
      setCategorias(c);
      setClientes(cl);
    });
  }, []);

  const loadRows = async () => {
    setLoading(true);
    const data = await getHistoricoMuebles({
      categoriaId: catId,
      clienteId,
      texto: texto.trim() || undefined,
    });
    setRows(data as any);
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
  }, [catId, clienteId]);

  const onSearchChange = (v: string) => {
    setTexto(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(loadRows, 300);
  };

  // Count per category (for pills)
  const countsByCat = useMemo(() => {
    const map = new Map<number | null, number>();
    rows.forEach((r) => {
      const k = r.categoria_mueble_id;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }, [rows]);

  const totalValor = rows.reduce(
    (s, r) => s + r.precio_unitario * (r.cantidad || 1),
    0
  );

  return (
    <div className="min-h-screen">
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              ARCHIVO · TALLER
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Histórico de{" "}
              <span className="gold-grad">Muebles</span>
            </h1>
            <p className="mt-3 text-[14px] text-text-muted max-w-[580px]">
              Todas las piezas entregadas o en curso, agrupadas por categoría.
              Úsalo para consultar precios de referencia, repetir fabricaciones
              o crear presupuestos a partir de obra pasada.
            </p>
          </div>
          <div className="flex gap-10 shrink-0">
            <div>
              <div className="mono text-[10px] tracking-[0.2em] text-text-muted mb-1">
                TOTAL REGISTROS
              </div>
              <div className="text-[28px] font-semibold num">{rows.length}</div>
            </div>
            <div>
              <div className="mono text-[10px] tracking-[0.2em] text-text-muted mb-1">
                VALOR ACUMULADO
              </div>
              <div className="text-[28px] font-semibold text-gold num">
                {fmtMoney(totalValor)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="px-10 pb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCatId(null)}
            className={`h-9 px-3.5 rounded-lg text-[12px] font-semibold flex items-center gap-2 transition ${
              catId === null
                ? "bg-gold text-bg"
                : "bg-surface-1 border border-border text-text-muted hover:text-text"
            }`}
          >
            Todas
            <span
              className={`mono text-[10px] px-1.5 h-5 rounded grid place-items-center ${
                catId === null ? "bg-bg/20 text-bg" : "bg-bg text-text-muted"
              }`}
            >
              {rows.length}
            </span>
          </button>
          {categorias.map((c) => {
            const count = countsByCat.get(c.id) || 0;
            const active = catId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCatId(active ? null : c.id)}
                className={`h-9 px-3.5 rounded-lg text-[12px] font-semibold flex items-center gap-2 transition ${
                  active
                    ? "bg-gold text-bg"
                    : "bg-surface-1 border border-border text-text-muted hover:text-text"
                }`}
              >
                <Icon name={catIcon(c.nombre)} size={13} />
                {c.nombre}
                <span
                  className={`mono text-[10px] px-1.5 h-5 rounded grid place-items-center ${
                    active ? "bg-bg/20 text-bg" : "bg-bg text-text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters bar */}
      <section className="px-10 pb-5">
        <div className="rounded-xl border border-border bg-surface-1 p-3 grid grid-cols-[200px_1fr_240px] gap-3 items-center">
          {/* Categoría dropdown (redundant but kept for consistency) */}
          <div>
            <div className="mono text-[9px] tracking-[0.2em] text-text-muted mb-1 uppercase">
              Categoría
            </div>
            <select
              value={catId || ""}
              onChange={(e) =>
                setCatId(e.target.value ? parseInt(e.target.value) : null)
              }
              className="ss-input w-full h-10 text-[13px]"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          {/* Search */}
          <div>
            <div className="mono text-[9px] tracking-[0.2em] text-text-muted mb-1 uppercase">
              Buscar
            </div>
            <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3 hover:border-[#3a3a3a] transition">
              <Icon name="search" size={13} className="text-text-muted mr-2" />
              <input
                value={texto}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Nombre o descripción..."
                className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text placeholder:text-[#555]"
              />
              {texto && (
                <button
                  onClick={() => {
                    setTexto("");
                    loadRows();
                  }}
                  className="mono text-[10px] tracking-[0.12em] text-[#555] hover:text-text"
                >
                  LIMPIAR
                </button>
              )}
            </div>
          </div>
          {/* Cliente */}
          <div>
            <div className="mono text-[9px] tracking-[0.2em] text-text-muted mb-1 uppercase">
              Cliente
            </div>
            <select
              value={clienteId || ""}
              onChange={(e) =>
                setClienteId(e.target.value ? parseInt(e.target.value) : null)
              }
              className="ss-input w-full h-10 text-[13px]"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="px-10 pb-10">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[150px]">
                  CATEGORÍA
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  NOMBRE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  DESCRIPCIÓN
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[130px]">
                  PRECIO UD.
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[220px]">
                  CLIENTE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                  FECHA
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[110px]">
                  Nº PRESUP.
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-muted">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${
                      i % 2 === 0 ? "bg-surface-1" : "bg-[#0D0D0D]"
                    }`}
                  >
                    <td className="pl-6 pr-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-surface-2 border border-border grid place-items-center text-text-muted">
                          <Icon
                            name={catIcon(r.categorias_mueble?.nombre)}
                            size={13}
                          />
                        </div>
                        <span className="text-[12px] text-text">
                          {r.categorias_mueble?.nombre || (
                            <span className="italic text-[#555]">Sin cat.</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-text">
                      {r.nombre}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted leading-tight max-w-[320px]">
                      {r.descripcion || "—"}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-gold font-semibold text-right num">
                      {fmtMoney(r.precio_unitario)}
                    </td>
                    <td className="px-3 py-3">
                      {r.clientes?.nombre ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full grid place-items-center text-[9px] font-bold shrink-0"
                            style={{
                              background: colorFromName(r.clientes.nombre).bg,
                              color: colorFromName(r.clientes.nombre).fg,
                            }}
                          >
                            {initials(r.clientes.nombre)}
                          </div>
                          <span className="text-[12px] text-text truncate">
                            {r.clientes.nombre}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-[#555] text-[12px]">
                          Cliente eliminado
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted num">
                      {parseFecha(r.fecha)}
                    </td>
                    <td className="px-3 py-3 mono text-[11px] text-gold">
                      {r.presupuestos?.numero_presupuesto
                        ? `PRE-${r.presupuestos.numero_presupuesto}`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
