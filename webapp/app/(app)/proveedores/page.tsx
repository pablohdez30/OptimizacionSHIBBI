"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  getMaterialesProveedor,
  crearMaterialProveedor,
  actualizarMaterialProveedor,
  eliminarMaterialProveedor,
  getCategoriasMaterial,
} from "@/lib/supabase";
import type { Proveedor, CategoriaMaterial } from "@/lib/types";
import { colorFromName, initials } from "@/lib/avatar";
import { toast } from "sonner";

// ---------- Edit Proveedor Modal ----------
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
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
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
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="relative px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">
              Nombre *
            </label>
            <input
              value={form.nombre || ""}
              onChange={(e) => upd("nombre", e.target.value)}
              placeholder="Nombre del proveedor"
              className="ss-input w-full h-10 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Teléfono
              </label>
              <input
                value={form.telefono || ""}
                onChange={(e) => upd("telefono", e.target.value)}
                placeholder="+34 9XX XXX XXX"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Email
              </label>
              <input
                value={form.email || ""}
                onChange={(e) => upd("email", e.target.value)}
                placeholder="correo@proveedor.com"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">
              Dirección
            </label>
            <input
              value={form.direccion || ""}
              onChange={(e) => upd("direccion", e.target.value)}
              placeholder="Dirección del proveedor"
              className="ss-input w-full h-10 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">
              Notas
            </label>
            <textarea
              value={form.notas || ""}
              onChange={(e) => upd("notas", e.target.value)}
              placeholder="Notas internas..."
              rows={3}
              className="ss-input w-full text-[13px] resize-none"
            />
          </div>
        </div>

        <div className="relative px-6 py-4 border-t border-surface-2 flex items-center justify-end gap-2 bg-[#0E0E0E]">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.nombre?.trim()}
            className="h-10 px-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
          >
            <Icon name="save" size={13} stroke={2.2} />
            {saving
              ? "Guardando..."
              : isNew
              ? "Crear proveedor"
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Material Form (inline in Materials Panel) ----------
function MaterialForm({
  initial,
  categorias,
  onSave,
  onCancel,
}: {
  initial?: any;
  categorias: CategoriaMaterial[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    descripcion_material: initial?.descripcion_material || "",
    categoria_material_id: initial?.categoria_material_id || categorias[0]?.id || 0,
    precio: initial?.precio ?? 0,
    unidad: initial?.unidad || "ud",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.descripcion_material.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        precio: parseFloat(String(form.precio)) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-border p-4 bg-[#0A0A0A]">
      <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3">
        {initial ? "EDITAR MATERIAL" : "NUEVO MATERIAL"}
      </div>
      <div className="grid grid-cols-[1fr_150px_110px_80px_auto] gap-2 items-end">
        <div>
          <label className="text-[11px] text-text-muted mb-1 block">Descripción</label>
          <input
            value={form.descripcion_material}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion_material: e.target.value }))
            }
            placeholder="Ej: Tablero roble 244x122cm"
            className="ss-input w-full h-9 text-[13px]"
          />
        </div>
        <div>
          <label className="text-[11px] text-text-muted mb-1 block">Categoría</label>
          <select
            value={form.categoria_material_id}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                categoria_material_id: parseInt(e.target.value),
              }))
            }
            className="ss-input w-full h-9 text-[13px]"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-text-muted mb-1 block">Precio €</label>
          <input
            type="number"
            step="0.01"
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value as any }))}
            className="ss-input w-full h-9 text-[13px] text-right"
          />
        </div>
        <div>
          <label className="text-[11px] text-text-muted mb-1 block">Ud.</label>
          <input
            value={form.unidad}
            onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
            className="ss-input w-full h-9 text-[13px]"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={onCancel}
            className="h-9 px-3 rounded-lg border border-border text-[12px] text-text-muted hover:text-text"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.descripcion_material.trim()}
            className="h-9 px-3 rounded-lg bg-gold text-bg text-[12px] font-semibold hover:bg-gold-light disabled:opacity-50"
          >
            {saving ? "..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Proveedor Row (expandable) ----------
function ProveedorRow({
  p,
  i,
  isOpen,
  mats,
  numCats,
  onToggle,
  onEdit,
  onDelete,
  onMatsChanged,
}: {
  p: Proveedor;
  i: number;
  isOpen: boolean;
  mats: any[];
  numCats: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMatsChanged: () => void;
}) {
  return (
    <>
      <tr
        className={`group border-b border-surface-2 transition-colors ${
          isOpen
            ? "bg-surface-2"
            : i % 2 === 1
            ? "bg-[#141414]"
            : "bg-surface-1"
        } hover:bg-surface-2`}
      >
        <td className="pl-6 pr-3 py-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg grid place-items-center text-[12px] font-bold flex-shrink-0"
              style={{
                background: `${colorFromName(p.nombre).bg}20`,
                border: `1px solid ${colorFromName(p.nombre).bg}50`,
                color: colorFromName(p.nombre).bg,
              }}
            >
              {initials(p.nombre)}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-text truncate group-hover:text-gold transition-colors">
                {p.nombre}
              </div>
              <div className="mt-0.5 mono text-[10px] text-[#555]">
                {mats.length} materiales ·{" "}
                <span className="text-text-muted">{numCats} categorías</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-4">
          {p.telefono ? (
            <a
              href={`tel:${p.telefono.replace(/\s/g, "")}`}
              className="mono text-[12px] text-text hover:text-gold"
            >
              {p.telefono}
            </a>
          ) : (
            <span className="text-[12px] text-text-muted">—</span>
          )}
        </td>
        <td className="px-3 py-4">
          {p.email ? (
            <a
              href={`mailto:${p.email}`}
              className="text-[12px] text-text hover:text-gold truncate block max-w-[200px]"
            >
              {p.email}
            </a>
          ) : (
            <span className="text-[12px] text-text-muted">—</span>
          )}
        </td>
        <td className="px-3 py-4">
          {p.direccion ? (
            <div className="flex items-start gap-2 text-[12px] text-[#BBB] leading-snug max-w-[260px]">
              <Icon
                name="pin"
                size={12}
                className="text-[#555] mt-0.5 flex-shrink-0"
              />
              <span>{p.direccion}</span>
            </div>
          ) : (
            <span className="text-[12px] text-text-muted">—</span>
          )}
        </td>
        <td className="px-3 py-4">
          <div className="text-[12px] text-text-muted italic leading-snug max-w-[220px]">
            {p.notas || "—"}
          </div>
        </td>
        <td className="pl-3 pr-6 py-4">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={onToggle}
              className={`h-8 px-3 rounded-[7px] text-[12px] flex items-center gap-1.5 transition font-medium ${
                isOpen
                  ? "bg-gold text-bg border border-gold"
                  : "border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/60"
              }`}
            >
              <Icon name="package" size={12} /> Ver materiales
              <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={12} />
            </button>
            <button
              onClick={onEdit}
              className="h-8 w-8 grid place-items-center rounded-[7px] border border-border text-text-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition"
            >
              <Icon name="edit" size={12} />
            </button>
            <button
              onClick={onDelete}
              className="h-8 w-8 grid place-items-center rounded-[7px] border border-border text-text-muted hover:text-[#F39C8E] hover:border-state-danger/40 hover:bg-state-danger/10 transition"
            >
              <Icon name="trash" size={13} />
            </button>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-transparent">
          <td colSpan={6} className="p-0">
            <MaterialsInlinePanel
              provId={p.id}
              provName={p.nombre}
              mats={mats}
              onChanged={onMatsChanged}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------- Materials Inline Panel ----------
function MaterialsInlinePanel({
  provId,
  provName,
  mats,
  onChanged,
}: {
  provId: number;
  provName: string;
  mats: any[];
  onChanged: () => void;
}) {
  const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    getCategoriasMaterial().then(setCategorias);
  }, []);

  const handleCreate = async (data: any) => {
    await crearMaterialProveedor({ ...data, proveedor_id: provId });
    setAdding(false);
    onChanged();
  };
  const handleEdit = async (id: number, data: any) => {
    await actualizarMaterialProveedor(id, data);
    setEditingId(null);
    onChanged();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este material?")) return;
    await eliminarMaterialProveedor(id);
    onChanged();
  };

  const avg =
    mats.length > 0
      ? mats.reduce((s, m) => s + m.precio, 0) / mats.length
      : 0;
  const latest = mats[0];
  const totalCats = new Set(mats.map((m) => m.categoria_material_id)).size;

  return (
    <div className="bg-[#0A0A0A] border-b border-border px-10 py-6">
      {/* header strip */}
      <div className="flex items-center gap-5 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/25 grid place-items-center text-gold">
            <Icon name="package" size={15} />
          </div>
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              HISTÓRICO DE MATERIALES
            </div>
            <div className="text-[14px] font-semibold text-text leading-none mt-0.5">
              {provName}
            </div>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-6 text-[12px]">
          <div>
            <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
              REFERENCIAS
            </div>
            <div className="num text-[15px] font-semibold text-text mt-0.5">
              {mats.length}
            </div>
          </div>
          <div>
            <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
              CATEGORÍAS
            </div>
            <div className="num text-[15px] font-semibold text-text mt-0.5">
              {totalCats}
            </div>
          </div>
          <div>
            <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
              PRECIO MEDIO
            </div>
            <div className="num text-[15px] font-semibold text-gold mt-0.5">
              {avg.toFixed(2)} €
            </div>
          </div>
          <div>
            <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
              ÚLTIMA COMPRA
            </div>
            <div className="text-[13px] text-text mt-0.5">
              {latest?.fecha_precio?.split("T")[0] || "—"}
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className="h-9 px-3.5 rounded-lg border border-gold/30 bg-gold/10 text-gold text-[12px] font-medium hover:bg-gold/20 flex items-center gap-1.5"
        >
          <Icon name="plus" size={13} stroke={2.2} /> Añadir material
        </button>
      </div>

      {/* add form */}
      {adding && (
        <div className="mb-3">
          <MaterialForm
            categorias={categorias}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {/* materials table */}
      <div className="rounded-[10px] border border-surface-2 bg-surface-1 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0E0E0E]">
            <tr>
              <th className="pl-5 pr-3 py-3 text-left mono text-[9px] tracking-[0.2em] text-text-muted font-medium">
                MATERIAL
              </th>
              <th className="px-3 py-3 text-left mono text-[9px] tracking-[0.2em] text-text-muted font-medium w-[150px]">
                CATEGORÍA
              </th>
              <th className="px-3 py-3 text-right mono text-[9px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                PRECIO
              </th>
              <th className="px-3 py-3 text-left mono text-[9px] tracking-[0.2em] text-text-muted font-medium w-[70px]">
                UNIDAD
              </th>
              <th className="px-3 py-3 text-left mono text-[9px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                FECHA
              </th>
              <th className="pl-3 pr-5 py-3 text-right mono text-[9px] tracking-[0.2em] text-text-muted font-medium w-[90px]">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {mats.length === 0 && !adding ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  Sin materiales. Añade el primero arriba.
                </td>
              </tr>
            ) : (
              mats.map((m, i) =>
                editingId === m.id ? (
                  <tr key={m.id}>
                    <td colSpan={6} className="p-3">
                      <MaterialForm
                        initial={m}
                        categorias={categorias}
                        onSave={(d) => handleEdit(m.id, d)}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={m.id}
                    className={`border-t border-surface-2 hover:bg-surface-2 ${
                      i % 2 === 1 ? "bg-[#0E0E0E]" : ""
                    }`}
                  >
                    <td className="pl-5 pr-3 py-3.5">
                      <span className="text-[13px] text-text">
                        {m.descripcion_material}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[12px] text-text-muted">
                      {m.categorias_material?.nombre || "—"}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="num text-[14px] font-semibold text-text">
                        {m.precio.toFixed(2)} €
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="mono text-[11px] text-text-muted">
                        {m.unidad}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-[12px] text-text-muted">
                        {m.fecha_precio?.split("T")[0] || "—"}
                      </span>
                    </td>
                    <td className="pl-3 pr-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setAdding(false);
                          }}
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2"
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-state-danger hover:bg-surface-2"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Obsolete Materials Panel (kept for reference, not used) ----------
function _MaterialsPanelObsolete({
  provId,
  provName,
  onClose,
}: {
  provId: number;
  provName: string;
  onClose: () => void;
}) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    const [mats, cats] = await Promise.all([
      getMaterialesProveedor(provId),
      getCategoriasMaterial(),
    ]);
    setMaterials(mats || []);
    setCategorias(cats);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [provId]);

  const handleCreate = async (data: any) => {
    await crearMaterialProveedor({ ...data, proveedor_id: provId });
    setAdding(false);
    load();
  };

  const handleEdit = async (id: number, data: any) => {
    await actualizarMaterialProveedor(id, data);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este material?")) return;
    await eliminarMaterialProveedor(id);
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[900px] max-w-full max-h-[85vh] rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              MATERIALES Y PRECIOS
            </div>
            <div className="text-[16px] font-semibold text-text mt-0.5">
              {provName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
              className="h-9 pl-3 pr-3.5 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
            >
              <Icon name="plus" size={13} stroke={2.4} /> Añadir material
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>

        {/* Add form */}
        {adding && (
          <MaterialForm
            categorias={categorias}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
          />
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-text-muted">Cargando...</div>
          ) : materials.length === 0 && !adding ? (
            <div className="text-center py-12 text-text-muted">
              Sin materiales registrados.
              <br />
              <button
                onClick={() => setAdding(true)}
                className="mt-3 text-gold hover:underline text-[13px]"
              >
                Añadir el primero
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#0A0A0A] border-b border-border sticky top-0">
                <tr>
                  <th className="pl-6 pr-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                    MATERIAL
                  </th>
                  <th className="px-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[150px]">
                    CATEGORÍA
                  </th>
                  <th className="px-3 py-3 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[110px]">
                    PRECIO
                  </th>
                  <th className="px-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[70px]">
                    UD.
                  </th>
                  <th className="px-3 py-3 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[100px]">
                    FECHA
                  </th>
                  <th className="px-3 py-3 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[90px]">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) =>
                  editingId === m.id ? (
                    <tr key={m.id}>
                      <td colSpan={6} className="p-0">
                        <MaterialForm
                          initial={m}
                          categorias={categorias}
                          onSave={(d) => handleEdit(m.id, d)}
                          onCancel={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={m.id}
                      className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${
                        i % 2 === 0 ? "bg-surface-1" : "bg-[#0D0D0D]"
                      }`}
                    >
                      <td className="pl-6 pr-3 py-2.5 text-[13px] text-text">
                        {m.descripcion_material}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-text-muted">
                        {m.categorias_material?.nombre || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-gold font-medium text-right num">
                        {m.precio.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-text-muted">
                        {m.unidad}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-text-muted">
                        {m.fecha_precio?.split("T")[0] || "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingId(m.id);
                              setAdding(false);
                            }}
                            className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2"
                            title="Editar"
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-state-danger hover:bg-surface-2"
                            title="Eliminar"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
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
  const [expanded, setExpanded] = useState<number | null>(null);
  const [matsByProv, setMatsByProv] = useState<Record<number, any[]>>({});

  const load = async () => {
    setLoading(true);
    const data = await getProveedores();
    setProveedores(data);
    // Cargar materiales en paralelo para contadores
    const mats: Record<number, any[]> = {};
    await Promise.all(
      data.map(async (p) => {
        mats[p.id] = (await getMaterialesProveedor(p.id)) || [];
      })
    );
    setMatsByProv(mats);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return proveedores;
    const s = q.toLowerCase();
    return proveedores.filter(
      (p) =>
        p.nombre.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s)
    );
  }, [proveedores, q]);

  const handleSave = async (form: Partial<Proveedor>) => {
    const { id, fecha_alta, activo, ...campos } = form;
    try {
      if (id) {
        await actualizarProveedor(id, campos);
        toast.success("Proveedor actualizado");
      } else {
        await crearProveedor(
          campos as Omit<Proveedor, "id" | "fecha_alta" | "activo">
        );
        toast.success("Proveedor creado");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error("No se pudo guardar", {
        description: (e as Error).message,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este proveedor?")) {
      await eliminarProveedor(id);
      load();
    }
  };

  return (
    <div className="min-h-screen">
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              CADENA DE SUMINISTRO
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Proveedores
            </h1>
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="text-text num font-medium">
                {proveedores.length} proveedores
              </span>{" "}
              ·{" "}
              <span className="text-text num font-medium">
                {Object.values(matsByProv).reduce((s, ms) => s + ms.length, 0)}{" "}
                materiales
              </span>{" "}
              en histórico
            </p>
          </div>
          <button
            onClick={() => setEditing({})}
            className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
          >
            <Icon name="plus" size={14} stroke={2.4} /> Nuevo Proveedor
          </button>
        </div>
      </section>

      <section className="px-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-[540px] flex items-center h-11 rounded-[10px] bg-surface-1 border border-border px-4 hover:border-[#3a3a3a] transition">
            <Icon name="search" size={15} className="text-text-muted mr-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar proveedor..."
              className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-text placeholder:text-[#555]"
            />
          </div>
          <div className="mono text-[11px] text-[#555]">
            {filtered.length} resultados
          </div>
        </div>
      </section>

      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  NOMBRE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  TELÉFONO
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  EMAIL
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  DIRECCIÓN
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  NOTAS
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[240px]">
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
                    No se encontraron proveedores.
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const isOpen = expanded === p.id;
                  const mats = matsByProv[p.id] || [];
                  const numCats = new Set(
                    mats.map((m) => m.categoria_material_id)
                  ).size;
                  return (
                    <ProveedorRow
                      key={p.id}
                      p={p}
                      i={i}
                      isOpen={isOpen}
                      mats={mats}
                      numCats={numCats}
                      onToggle={() => setExpanded(isOpen ? null : p.id)}
                      onEdit={() => setEditing(p)}
                      onDelete={() => handleDelete(p.id)}
                      onMatsChanged={load}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing !== null && (
        <EditModal
          prov={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
