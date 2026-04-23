"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getHistoricoMuebles,
  getCategoriasMueble,
  getClientes,
  actualizarHistoricoMueble,
  eliminarHistoricoMueble,
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

// Meta por categoría: icono + color (igual al design system)
const CAT_META: Record<string, { icon: string; color: string }> = {
  Mesa: { icon: "package", color: "#D4A574" },
  Mueble: { icon: "archive", color: "#9DA4AE" },
  Estantería: { icon: "archive", color: "#A78BFA" },
  Escultura: { icon: "tag", color: "#F39C8E" },
  Consola: { icon: "archive", color: "#7AB3D9" },
  Cerramiento: { icon: "archive", color: "#6FBF8E" },
  Espejo: { icon: "eye", color: "#E0A6D6" },
  Otros: { icon: "package", color: "#FAC51C" },
};
const catMeta = (name?: string | null) =>
  CAT_META[name || ""] || { icon: "package", color: "#888" };

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

// ---------- Edit Modal ----------
function EditRowModal({
  row,
  categorias,
  onClose,
  onSave,
  onDelete,
}: {
  row: HistoricoRow;
  categorias: CategoriaMueble[];
  onClose: () => void;
  onSave: (campos: any) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio_unitario: row.precio_unitario,
    cantidad: row.cantidad,
    categoria_mueble_id: row.categoria_mueble_id,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...form,
      precio_unitario: parseFloat(String(form.precio_unitario)) || 0,
      cantidad: parseInt(String(form.cantidad)) || 1,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[620px] max-w-full rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              EDITAR · HISTÓRICO
            </div>
            <div className="text-[16px] font-semibold text-text mt-0.5">
              {row.nombre}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="relative px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                Nombre
              </label>
              <input
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                rows={2}
                className="ss-input w-full text-[13px] resize-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Categoría
              </label>
              <select
                value={form.categoria_mueble_id || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    categoria_mueble_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                className="ss-input w-full h-10 text-[13px]"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Cantidad
              </label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cantidad: e.target.value as any }))
                }
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                Precio unitario (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.precio_unitario}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    precio_unitario: e.target.value as any,
                  }))
                }
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>
          </div>
        </div>

        <div className="relative px-6 py-4 border-t border-surface-2 flex items-center justify-between bg-[#0E0E0E]">
          <button
            onClick={async () => {
              if (!confirm("¿Eliminar este registro del histórico?")) return;
              await onDelete();
            }}
            className="h-10 px-3.5 rounded-lg border border-state-danger/30 bg-state-danger/10 text-[#F39C8E] text-[13px] hover:bg-state-danger/20 flex items-center gap-2"
          >
            <Icon name="trash" size={13} /> Eliminar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
            >
              <Icon name="save" size={13} stroke={2.2} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const [editing, setEditing] = useState<HistoricoRow | null>(null);
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

  // Total registros por categoría (para pills)
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

  const handleSave = async (campos: any) => {
    if (!editing) return;
    await actualizarHistoricoMueble(editing.id, campos);
    setEditing(null);
    loadRows();
  };

  const handleDelete = async () => {
    if (!editing) return;
    await eliminarHistoricoMueble(editing.id);
    setEditing(null);
    loadRows();
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              ARCHIVO · TALLER
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Histórico de <span className="gold-grad">Muebles</span>
            </h1>
            <p className="mt-3 text-[15px] text-text-muted max-w-[640px]">
              Todas las piezas entregadas o en curso, agrupadas por categoría.
              Úsalo para consultar precios de referencia, repetir fabricaciones
              o crear presupuestos a partir de obra pasada.
            </p>
          </div>
          <div className="flex items-center gap-4 pr-1">
            <div>
              <div className="mono text-[10px] tracking-[0.2em] text-[#555]">
                TOTAL REGISTROS
              </div>
              <div className="num text-[34px] leading-none font-semibold text-text mt-1">
                {rows.length}
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="mono text-[10px] tracking-[0.2em] text-[#555]">
                VALOR ACUMULADO
              </div>
              <div className="num text-[34px] leading-none font-semibold gold-grad mt-1">
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
            className={`h-9 pl-3 pr-3 rounded-[10px] border text-[13px] flex items-center gap-2 transition ${
              catId === null
                ? "bg-gold border-gold text-bg font-semibold"
                : "bg-[#0E0E0E] border-border text-text-muted hover:text-text hover:border-[#3a3a3a]"
            }`}
          >
            <span>Todas</span>
            <span
              className={`mono text-[10px] px-1.5 h-5 rounded grid place-items-center ${
                catId === null ? "bg-bg/15 text-bg" : "bg-surface-2 text-[#555]"
              }`}
            >
              {rows.length}
            </span>
          </button>
          {categorias.map((c) => {
            const count = countsByCat.get(c.id) || 0;
            const active = catId === c.id;
            const m = catMeta(c.nombre);
            return (
              <button
                key={c.id}
                onClick={() => setCatId(active ? null : c.id)}
                className={`h-9 pl-3 pr-3 rounded-[10px] border text-[13px] flex items-center gap-2 transition ${
                  active
                    ? "bg-gold border-gold text-bg font-semibold"
                    : "bg-[#0E0E0E] border-border text-text-muted hover:text-text hover:border-[#3a3a3a]"
                }`}
              >
                <Icon name={m.icon} size={13} />
                <span>{c.nombre}</span>
                <span
                  className={`mono text-[10px] px-1.5 h-5 rounded grid place-items-center ${
                    active
                      ? "bg-bg/15 text-bg"
                      : "bg-surface-2 text-[#555]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter bar */}
      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 p-5">
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-3">
              <div className="mono text-[9px] tracking-[0.2em] text-text-muted mb-1.5 uppercase">
                Categoría
              </div>
              <select
                value={catId || ""}
                onChange={(e) =>
                  setCatId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="ss-input w-full h-11 text-[14px]"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-5">
              <div className="mono text-[9px] tracking-[0.2em] text-text-muted mb-1.5 uppercase">
                Buscar
              </div>
              <div className="flex items-center h-11 rounded-[10px] bg-[#0E0E0E] border border-border px-3.5 hover:border-[#3a3a3a] transition">
                <Icon name="search" size={15} className="mr-2.5 text-[#555]" />
                <input
                  value={texto}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Nombre o descripción..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-text placeholder:text-[#555]"
                />
                {texto && (
                  <button
                    onClick={() => {
                      setTexto("");
                      loadRows();
                    }}
                    className="text-[#555] hover:text-text mono text-[10px] tracking-[0.12em]"
                  >
                    LIMPIAR
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-3">
              <div className="mono text-[9px] tracking-[0.2em] text-text-muted mb-1.5 uppercase">
                Cliente
              </div>
              <select
                value={clienteId || ""}
                onChange={(e) =>
                  setClienteId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="ss-input w-full h-11 text-[14px]"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <button
                onClick={loadRows}
                className="w-full h-11 rounded-[10px] bg-gold text-bg text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-gold-light"
              >
                <Icon name="filter" size={14} stroke={2.2} /> Filtrar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="px-10 pb-10">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-4 text-left mono text-[10px] tracking-[0.2em] text-gold font-medium w-[170px]">
                  CATEGORÍA
                </th>
                <th className="px-3 py-4 text-left mono text-[10px] tracking-[0.2em] text-gold font-medium w-[220px]">
                  NOMBRE
                </th>
                <th className="px-3 py-4 text-left mono text-[10px] tracking-[0.2em] text-gold font-medium">
                  DESCRIPCIÓN
                </th>
                <th className="px-3 py-4 text-right mono text-[10px] tracking-[0.2em] text-gold font-medium w-[130px]">
                  PRECIO UD.
                </th>
                <th className="px-3 py-4 text-left mono text-[10px] tracking-[0.2em] text-gold font-medium w-[200px]">
                  CLIENTE
                </th>
                <th className="px-3 py-4 text-left mono text-[10px] tracking-[0.2em] text-gold font-medium w-[130px]">
                  FECHA
                </th>
                <th className="pl-3 pr-6 py-4 text-left mono text-[10px] tracking-[0.2em] text-gold font-medium w-[160px]">
                  Nº PRESUP.
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-text-muted">
                    Cargando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-surface-2 grid place-items-center mb-3">
                      <Icon name="search" size={18} className="text-[#555]" />
                    </div>
                    <div className="text-[14px] text-text mb-1">
                      Sin resultados
                    </div>
                    <div className="text-[12px] text-[#555]">
                      Ajusta los filtros.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const cm = catMeta(r.categorias_mueble?.nombre);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setEditing(r)}
                      className={`group border-b border-surface-2 last:border-b-0 transition-colors cursor-pointer ${
                        i % 2 === 1 ? "bg-[#141414]" : "bg-surface-1"
                      } hover:bg-surface-2`}
                    >
                      <td className="pl-6 pr-3 py-5">
                        <div className="inline-flex items-center gap-2.5">
                          <div
                            className="h-9 w-9 rounded-lg grid place-items-center flex-shrink-0"
                            style={{
                              background: `${cm.color}15`,
                              border: `1px solid ${cm.color}30`,
                              color: cm.color,
                            }}
                          >
                            <Icon name={cm.icon} size={16} stroke={1.6} />
                          </div>
                          <span
                            className="text-[14px] font-medium"
                            style={{ color: cm.color }}
                          >
                            {r.categorias_mueble?.nombre || "Sin cat."}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        <div className="text-[17px] font-semibold text-text tracking-[-0.01em] group-hover:text-gold transition-colors">
                          {r.nombre}
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        <div className="text-[15px] text-[#BBBBBB] leading-[1.4] max-w-[520px]">
                          {r.descripcion || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-5 text-right">
                        <div className="num text-[18px] font-semibold text-text">
                          {fmtMoney(r.precio_unitario)}
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        {r.clientes?.nombre ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-lg grid place-items-center text-[11px] font-semibold flex-shrink-0"
                              style={{
                                background: colorFromName(r.clientes.nombre).bg,
                                color: colorFromName(r.clientes.nombre).fg,
                              }}
                            >
                              {initials(r.clientes.nombre)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[14px] text-text truncate">
                                {r.clientes.nombre}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="italic text-[#555] text-[12px]">
                            Cliente eliminado
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-5">
                        <div className="text-[14px] text-text">
                          {parseFecha(r.fecha)}
                        </div>
                      </td>
                      <td className="pl-3 pr-6 py-5">
                        {r.presupuestos?.numero_presupuesto ? (
                          <span className="inline-flex items-center gap-1.5 mono text-[13px] text-gold">
                            <span>{r.presupuestos.numero_presupuesto}</span>
                            <Icon
                              name="external"
                              size={13}
                              stroke={2}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </span>
                        ) : (
                          <span className="text-[#555] text-[12px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <EditRowModal
          row={editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
