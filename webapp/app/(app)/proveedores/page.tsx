"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  getMaterialesProveedor,
} from "@/lib/supabase";
import type { Proveedor } from "@/lib/types";

function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ---------- Edit Modal ----------
function EditModal({
  prov,
  onClose,
  onSave,
}: {
  prov: Partial<Proveedor> | null;
  onClose: () => void;
  onSave: (p: Partial<Proveedor>) => void;
}) {
  const isNew = !prov?.id;
  const [form, setForm] = useState<Partial<Proveedor>>(
    prov || { nombre: "", telefono: "", email: "", direccion: "", notas: "" }
  );
  const [saving, setSaving] = useState(false);

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[560px] max-w-full rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              {isNew ? "NUEVO · PROVEEDOR" : "EDITAR · PROVEEDOR"}
            </div>
            <div className="text-[16px] font-semibold text-text mt-0.5">
              {isNew ? "Crear proveedor" : form.nombre || "Sin nombre"}
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2">
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="relative px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">Nombre *</label>
            <input value={form.nombre || ""} onChange={(e) => upd("nombre", e.target.value)}
              placeholder="Nombre del proveedor" className="ss-input w-full h-10 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">Teléfono</label>
              <input value={form.telefono || ""} onChange={(e) => upd("telefono", e.target.value)}
                placeholder="+34 9XX XXX XXX" className="ss-input w-full h-10 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">Email</label>
              <input value={form.email || ""} onChange={(e) => upd("email", e.target.value)}
                placeholder="correo@proveedor.com" className="ss-input w-full h-10 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">Dirección</label>
            <input value={form.direccion || ""} onChange={(e) => upd("direccion", e.target.value)}
              placeholder="Dirección del proveedor" className="ss-input w-full h-10 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">Notas</label>
            <textarea value={form.notas || ""} onChange={(e) => upd("notas", e.target.value)}
              placeholder="Notas internas..." rows={3}
              className="ss-input w-full text-[13px] resize-none" />
          </div>
        </div>

        <div className="relative px-6 py-4 border-t border-surface-2 flex items-center justify-end gap-2 bg-[#0E0E0E]">
          <button onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.nombre?.trim()}
            className="h-10 px-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50">
            <Icon name="save" size={13} stroke={2.2} />
            {saving ? "Guardando..." : isNew ? "Crear proveedor" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Materials Panel ----------
function MaterialsPanel({
  provId,
  provName,
  onClose,
}: {
  provId: number;
  provName: string;
  onClose: () => void;
}) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMaterialesProveedor(provId).then((data) => {
      setMaterials(data || []);
      setLoading(false);
    });
  }, [provId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[700px] max-w-full max-h-[80vh] rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">MATERIALES</div>
            <div className="text-[16px] font-semibold text-text mt-0.5">{provName}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2">
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-text-muted">Cargando...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 text-text-muted">Sin materiales registrados.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#0A0A0A] border-b border-border sticky top-0">
                <tr>
                  <th className="pl-6 pr-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">MATERIAL</th>
                  <th className="px-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">CATEGORÍA</th>
                  <th className="px-3 py-3 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium">PRECIO</th>
                  <th className="px-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">UD.</th>
                  <th className="px-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">FECHA</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={m.id} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-surface-1" : "bg-[#0D0D0D]"}`}>
                    <td className="pl-6 pr-3 py-2.5 text-[13px] text-text">{m.descripcion_material}</td>
                    <td className="px-3 py-2.5 text-[12px] text-text-muted">
                      {m.categorias_material?.nombre || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-gold font-medium text-right num">
                      {m.precio.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-text-muted">{m.unidad}</td>
                    <td className="px-3 py-2.5 text-[12px] text-text-muted">
                      {m.fecha_precio?.split("T")[0] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Proveedor> | null>(null);
  const [viewingMats, setViewingMats] = useState<Proveedor | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getProveedores();
    setProveedores(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return proveedores;
    const s = q.toLowerCase();
    return proveedores.filter(
      (p) => p.nombre.toLowerCase().includes(s) || p.email.toLowerCase().includes(s)
    );
  }, [proveedores, q]);

  const handleSave = async (form: Partial<Proveedor>) => {
    if (form.id) {
      await actualizarProveedor(form.id, form);
    } else {
      await crearProveedor(form as Omit<Proveedor, "id" | "fecha_alta" | "activo">);
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este proveedor?")) {
      await eliminarProveedor(id);
      load();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              GESTIÓN · PROVEEDORES
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">Proveedores</h1>
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="text-text num">{proveedores.length} proveedores</span>
            </p>
          </div>
          <button onClick={() => setEditing({})}
            className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light">
            <Icon name="plus" size={14} stroke={2.4} /> Nuevo Proveedor
          </button>
        </div>
      </section>

      {/* Search */}
      <section className="px-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-[540px] flex items-center h-11 rounded-[10px] bg-surface-1 border border-border px-4 hover:border-[#3a3a3a] transition">
            <Icon name="search" size={15} className="text-text-muted mr-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar proveedor..." className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-text placeholder:text-[#555]" />
          </div>
          <div className="mono text-[11px] text-[#555]">{filtered.length} resultados</div>
        </div>
      </section>

      {/* Table */}
      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">NOMBRE</th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">TELÉFONO</th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">EMAIL</th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">DIRECCIÓN</th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">NOTAS</th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[130px]">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-muted">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-muted">No se encontraron proveedores.</td></tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${i % 2 === 0 ? "bg-surface-1" : "bg-[#0D0D0D]"}`}>
                    <td className="pl-6 pr-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-gold-dark text-bg grid place-items-center text-[10px] font-bold shrink-0">
                          {initials(p.nombre)}
                        </div>
                        <span className="text-[13px] font-medium text-text">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">{p.telefono || "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">{p.email || "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-text-muted truncate max-w-[180px]">{p.direccion || "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-text-muted truncate max-w-[150px]">{p.notas || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingMats(p)} title="Ver materiales"
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2">
                          <Icon name="search" size={13} />
                        </button>
                        <button onClick={() => setEditing(p)} title="Editar"
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2">
                          <Icon name="edit" size={13} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} title="Eliminar"
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-state-danger hover:bg-surface-2">
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
      </section>

      {/* Modals */}
      {editing !== null && <EditModal prov={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {viewingMats && <MaterialsPanel provId={viewingMats.id} provName={viewingMats.nombre} onClose={() => setViewingMats(null)} />}
    </div>
  );
}
