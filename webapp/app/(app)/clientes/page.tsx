"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "@/lib/supabase";
import type { Cliente } from "@/lib/types";

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
  client,
  onClose,
  onSave,
}: {
  client: Partial<Cliente> | null;
  onClose: () => void;
  onSave: (c: Partial<Cliente>) => void;
}) {
  const isNew = !client?.id;
  const [form, setForm] = useState<Partial<Cliente>>(
    client || { nombre: "", direccion: "", telefono: "", email: "", nif_cif: "" }
  );
  const [saving, setSaving] = useState(false);

  const upd = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[640px] max-w-full rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div className="flex items-center gap-3">
            {!isNew ? (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold-dark text-bg grid place-items-center text-[12px] font-bold">
                {initials(form.nombre || "—")}
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full border border-dashed border-border grid place-items-center text-text-muted">
                <Icon name="plus" size={16} stroke={2} />
              </div>
            )}
            <div>
              <div className="mono text-[10px] tracking-[0.2em] text-gold">
                {isNew ? "NUEVO · CLIENTE" : "EDITAR · CLIENTE"}
              </div>
              <div className="text-[16px] font-semibold text-text mt-0.5 leading-none">
                {isNew ? "Crear nuevo contacto" : form.nombre || "Sin nombre"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="relative px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                Nombre *
              </label>
              <input
                value={form.nombre || ""}
                onChange={(e) => upd("nombre", e.target.value)}
                placeholder="Nombre del cliente"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Teléfono
              </label>
              <input
                value={form.telefono || ""}
                onChange={(e) => upd("telefono", e.target.value)}
                placeholder="+34 6XX XXX XXX"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                NIF / CIF
              </label>
              <input
                value={form.nif_cif || ""}
                onChange={(e) => upd("nif_cif", e.target.value)}
                placeholder="12345678A"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                Email
              </label>
              <input
                value={form.email || ""}
                onChange={(e) => upd("email", e.target.value)}
                placeholder="correo@dominio.com"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                Dirección
              </label>
              <input
                value={form.direccion || ""}
                onChange={(e) => upd("direccion", e.target.value)}
                placeholder="Calle, número, piso"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Ciudad
              </label>
              <input
                value={form.ciudad || ""}
                onChange={(e) => upd("ciudad", e.target.value)}
                placeholder="Ciudad"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-text mb-2 block">
                Código Postal
              </label>
              <input
                value={form.codigo_postal || ""}
                onChange={(e) => upd("codigo_postal", e.target.value)}
                placeholder="28001"
                className="ss-input w-full h-10 text-[13px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-6 py-4 border-t border-surface-2 flex items-center justify-end gap-2 bg-[#0E0E0E]">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text hover:border-[#3a3a3a]"
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
              ? "Crear cliente"
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Delete Modal ----------
function DeleteModal({
  client,
  onClose,
  onConfirm,
}: {
  client: Cliente;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[460px] max-w-full rounded-[14px] border border-border bg-surface-1 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] overflow-hidden">
        <div className="p-6">
          <div className="h-12 w-12 rounded-full bg-state-danger/15 border border-state-danger/30 grid place-items-center text-state-danger mb-4">
            <Icon name="trash" size={20} />
          </div>
          <h3 className="text-[18px] font-semibold text-text">
            Eliminar cliente
          </h3>
          <p className="mt-2 text-[13px] text-text-muted leading-relaxed">
            ¿Seguro que quieres eliminar{" "}
            <span className="text-text font-medium">{client.nombre}</span>?
            Se marcará como inactivo.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-surface-2 bg-[#0E0E0E] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="h-10 px-4 rounded-lg bg-state-danger text-white text-[13px] font-semibold hover:bg-red-600 flex items-center gap-1.5"
          >
            <Icon name="trash" size={13} stroke={2} /> Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function ClientesPage() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Cliente> | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClients(data);
    } catch (e) {
      console.error("Error loading clients:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return clients;
    const s = q.toLowerCase();
    return clients.filter(
      (c) =>
        c.nombre.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.nif_cif.toLowerCase().includes(s) ||
        c.telefono.includes(s)
    );
  }, [clients, q]);

  const handleSave = async (form: Partial<Cliente>) => {
    if (form.id) {
      await actualizarCliente(form.id, form);
    } else {
      await crearCliente(form as Omit<Cliente, "id" | "fecha_alta" | "activo">);
    }
    setEditing(null);
    loadClients();
  };

  const handleDelete = async (id: number) => {
    await eliminarCliente(id);
    setDeleting(null);
    loadClients();
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              CRM · CONTACTOS
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Clientes
            </h1>
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="text-text num">{clients.length} contactos</span>
            </p>
          </div>
          <button
            onClick={() => setEditing({})}
            className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
          >
            <Icon name="plus" size={14} stroke={2.4} /> Nuevo Cliente
          </button>
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
              placeholder="Buscar por nombre, email, NIF o teléfono..."
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
      <section className="px-10 pb-6">
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-border">
              <tr>
                <th className="pl-6 pr-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  NOMBRE
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  DIRECCIÓN
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[150px]">
                  TELÉFONO
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium">
                  EMAIL
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[120px]">
                  NIF/CIF
                </th>
                <th className="px-3 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[100px]">
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
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${
                      i % 2 === 0 ? "bg-surface-1" : "bg-[#0D0D0D]"
                    }`}
                  >
                    <td className="pl-6 pr-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-gold-dark text-bg grid place-items-center text-[10px] font-bold shrink-0">
                          {initials(c.nombre)}
                        </div>
                        <span className="text-[13px] font-medium text-text">
                          {c.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted truncate max-w-[200px]">
                      {c.direccion || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">
                      {c.telefono || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">
                      {c.email || "—"}
                    </td>
                    <td className="px-3 py-3 mono text-[11px] text-text-muted">
                      {c.nif_cif || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(c)}
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-gold hover:bg-surface-2"
                          title="Editar"
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          onClick={() => setDeleting(c)}
                          className="h-7 w-7 grid place-items-center rounded-md text-text-muted hover:text-state-danger hover:bg-surface-2"
                          title="Eliminar"
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
      </section>

      {/* Modals */}
      {editing !== null && (
        <EditModal
          client={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
      {deleting && (
        <DeleteModal
          client={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting.id)}
        />
      )}
    </div>
  );
}
