"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import {
  getHistoricoMuebles,
  getCategoriasMueble,
  getClientes,
} from "@/lib/supabase";
import type { CategoriaMueble, Cliente } from "@/lib/types";

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

function parseFecha(fecha: string) {
  try {
    return new Date(fecha).toLocaleDateString("es-ES");
  } catch {
    return fecha;
  }
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

  return (
    <div className="min-h-screen">
      <section className="px-10 pt-10 pb-6">
        <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gold" />
          REFERENCIAS · PRECIOS
        </div>
        <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
          Histórico de Muebles
        </h1>
        <p className="mt-3 text-[14px] text-text-muted">
          Consulta precios pasados y referencias para nuevos presupuestos.
        </p>
      </section>

      {/* Filters */}
      <section className="px-10 pb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Categoría filter */}
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
              CATEGORÍA
            </span>
            <select
              value={catId || ""}
              onChange={(e) =>
                setCatId(e.target.value ? parseInt(e.target.value) : null)
              }
              className="ss-input h-10 text-[13px] min-w-[140px]"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente filter */}
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
              CLIENTE
            </span>
            <select
              value={clienteId || ""}
              onChange={(e) =>
                setClienteId(e.target.value ? parseInt(e.target.value) : null)
              }
              className="ss-input h-10 text-[13px] min-w-[200px]"
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[260px] max-w-[400px] flex items-center h-10 rounded-lg bg-surface-1 border border-border px-3 hover:border-[#3a3a3a] transition">
            <Icon name="search" size={14} className="text-text-muted mr-2" />
            <input
              value={texto}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar nombre o descripción..."
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

          <div className="mono text-[11px] text-[#555]">{rows.length} resultados</div>
        </div>
      </section>

      {/* Table */}
      <section className="px-10 pb-10">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[130px]">
                  CATEGORÍA
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  NOMBRE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  DESCRIPCIÓN
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                  PRECIO UD.
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[200px]">
                  CLIENTE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[110px]">
                  FECHA
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[100px]">
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
                    <td className="pl-6 pr-3 py-3 text-[12px] text-text-muted">
                      {r.categorias_mueble?.nombre || (
                        <span className="italic text-[#555]">Sin cat.</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-medium text-text">
                      {r.nombre}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted truncate max-w-[280px]">
                      {r.descripcion || "—"}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-gold font-semibold text-right num">
                      {r.precio_unitario.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {" €"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">
                      {r.clientes?.nombre || (
                        <span className="italic text-[#555]">
                          Cliente eliminado
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted num">
                      {parseFecha(r.fecha)}
                    </td>
                    <td className="px-3 py-3 mono text-[11px] text-gold">
                      {r.presupuestos?.numero_presupuesto || "—"}
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
