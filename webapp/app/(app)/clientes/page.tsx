"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  getClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  contarPresupuestosPorCliente,
} from "@/lib/supabase";
import type { Cliente } from "@/lib/types";
import { colorFromName, initials } from "@/lib/avatar";

// NIF/CIF español:
//  - CIF (empresa): empieza por letra (A, B, C, D, E, F, G, H, J, N, P, Q, R, S, U, V, W)
//  - NIF (particular): empieza por número o letras K, L, M, X, Y, Z (residentes)
const CIF_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "N", "P", "Q", "R", "S", "U", "V", "W"];

type ClienteKind = "Particular" | "Empresa";

function kindFromNif(nif: string | null | undefined): ClienteKind {
  if (!nif) return "Particular";
  const first = nif.trim().charAt(0).toUpperCase();
  return CIF_LETTERS.includes(first) ? "Empresa" : "Particular";
}

// ---------- Edit Modal ----------
function EditModal({
  client,
  onClose,
  onSave,
  onDelete,
}: {
  client: Partial<Cliente> | null;
  onClose: () => void;
  onSave: (c: Partial<Cliente>) => void;
  onDelete?: () => void;
}) {
  const isNew = !client?.id;
  const [form, setForm] = useState<Partial<Cliente>>(
    client || {
      nombre: "",
      direccion: "",
      ciudad: "",
      codigo_postal: "",
      telefono: "",
      email: "",
      nif_cif: "",
    }
  );
  const [kind, setKind] = useState<ClienteKind>(kindFromNif(client?.nif_cif));
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
              kind === "Empresa" ? (
                <div className="h-10 w-10 rounded-lg bg-surface-2 border border-border grid place-items-center text-gold">
                  <Icon name="building" size={16} />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gold to-gold-dark text-bg grid place-items-center text-[12px] font-bold">
                  {initials(form.nombre || "—")}
                </div>
              )
            ) : (
              <div className="h-10 w-10 rounded-lg border border-dashed border-border grid place-items-center text-text-muted">
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
        <div className="relative px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Kind toggle */}
          <div>
            <div className="mono text-[9px] tracking-[0.2em] text-[#555] mb-2 uppercase">
              Tipo de cliente
            </div>
            <div className="inline-flex p-1 rounded-lg bg-[#0E0E0E] border border-border">
              {(["Particular", "Empresa"] as ClienteKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`h-9 px-4 rounded-[7px] text-[12px] flex items-center gap-2 transition ${
                    kind === k
                      ? "bg-gold text-bg font-semibold"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Icon name={k === "Empresa" ? "building" : "user"} size={13} />
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-text mb-2 block">
                {kind === "Empresa" ? "Razón social *" : "Nombre completo *"}
              </label>
              <input
                value={form.nombre || ""}
                onChange={(e) => upd("nombre", e.target.value)}
                placeholder={
                  kind === "Empresa"
                    ? "Nombre legal de la empresa"
                    : "Apellidos, Nombre"
                }
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
                {kind === "Empresa" ? "CIF" : "NIF"}
              </label>
              <input
                value={form.nif_cif || ""}
                onChange={(e) => upd("nif_cif", e.target.value)}
                placeholder={kind === "Empresa" ? "B-XX XXX XXX" : "XX XXX XXX-L"}
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
        <div className="relative px-6 py-4 border-t border-surface-2 flex items-center justify-between bg-[#0E0E0E]">
          {!isNew && onDelete ? (
            <button
              onClick={onDelete}
              className="h-10 px-3.5 rounded-lg border border-state-danger/30 bg-state-danger/10 text-[#F39C8E] text-[13px] hover:bg-state-danger/20 flex items-center gap-2"
            >
              <Icon name="trash" size={13} /> Eliminar cliente
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
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
              {saving ? "Guardando..." : isNew ? "Crear cliente" : "Guardar cambios"}
            </button>
          </div>
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
          <div className="h-12 w-12 rounded-lg bg-state-danger/15 border border-state-danger/30 grid place-items-center text-state-danger mb-4">
            <Icon name="trash" size={20} />
          </div>
          <h3 className="text-[18px] font-semibold text-text">Eliminar cliente</h3>
          <p className="mt-2 text-[13px] text-text-muted leading-relaxed">
            ¿Seguro que quieres eliminar{" "}
            <span className="text-text font-medium">{client.nombre}</span>?
            Se marcará como inactivo. Los presupuestos y facturas asociados se
            conservan.
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
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<"Todos" | "Particular" | "Empresa">("Todos");
  const [editing, setEditing] = useState<Partial<Cliente> | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const [data, countsData] = await Promise.all([
        getClientes(),
        contarPresupuestosPorCliente(),
      ]);
      setClients(data);
      setCounts(countsData);
    } catch (e) {
      console.error("Error loading clients:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const withKind = useMemo(
    () => clients.map((c) => ({ ...c, kind: kindFromNif(c.nif_cif) })),
    [clients]
  );

  const filtered = useMemo(() => {
    return withKind.filter((c) => {
      if (kindFilter !== "Todos" && c.kind !== kindFilter) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.nif_cif || "").toLowerCase().includes(s) ||
        (c.telefono || "").includes(s) ||
        (c.direccion || "").toLowerCase().includes(s)
      );
    });
  }, [withKind, q, kindFilter]);

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
    setEditing(null);
    loadClients();
  };

  const particulares = withKind.filter((c) => c.kind === "Particular").length;
  const empresas = withKind.filter((c) => c.kind === "Empresa").length;

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
              <span className="text-text num font-medium">
                {clients.length} contactos
              </span>{" "}
              · {particulares} particulares · {empresas} empresas
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

      {/* Search + filter */}
      <section className="px-10 pb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[300px] max-w-[540px] flex items-center h-11 rounded-[10px] bg-surface-1 border border-border px-4 hover:border-[#3a3a3a] transition">
            <Icon name="search" size={15} className="text-text-muted mr-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente por nombre, email, NIF o dirección..."
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

          {/* Kind filter */}
          <div className="inline-flex p-1 rounded-[10px] bg-surface-1 border border-border">
            {(["Todos", "Particular", "Empresa"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`h-9 px-3.5 rounded-[7px] text-[12px] transition flex items-center gap-2 ${
                  kindFilter === k
                    ? "bg-gold text-bg font-semibold"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {k === "Particular" && <Icon name="user" size={12} />}
                {k === "Empresa" && <Icon name="building" size={12} />}
                {k}
              </button>
            ))}
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
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[160px]">
                  TELÉFONO
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[230px]">
                  EMAIL
                </th>
                <th className="px-3 py-3.5 text-left mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[140px]">
                  NIF/CIF
                </th>
                <th className="pl-3 pr-6 py-3.5 text-right mono text-[10px] tracking-[0.2em] text-text-muted font-medium w-[140px]">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-text-muted">
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-surface-2 grid place-items-center mb-3">
                      <Icon name="search" size={18} className="text-[#555]" />
                    </div>
                    <div className="text-[14px] text-text mb-1">
                      Sin resultados
                    </div>
                    <div className="text-[12px] text-[#555]">
                      Ajusta la búsqueda.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const nProjects = counts[c.id] || 0;
                  return (
                    <tr
                      key={c.id}
                      className={`group border-b border-surface-2 last:border-b-0 transition-colors ${
                        i % 2 === 1 ? "bg-[#141414]" : "bg-surface-1"
                      } hover:bg-surface-2`}
                    >
                      <td className="pl-6 pr-3 py-4">
                        <div className="flex items-center gap-3">
                          {c.kind === "Empresa" ? (
                            <div className="h-10 w-10 rounded-lg bg-surface-2 border border-border grid place-items-center text-gold flex-shrink-0">
                              <Icon name="building" size={15} />
                            </div>
                          ) : (
                            <div
                              className="h-10 w-10 rounded-lg grid place-items-center text-[12px] font-semibold flex-shrink-0"
                              style={{
                                background: `${colorFromName(c.nombre).bg}20`,
                                border: `1px solid ${colorFromName(c.nombre).bg}50`,
                                color: colorFromName(c.nombre).bg,
                              }}
                            >
                              {initials(c.nombre)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[14px] font-medium text-text truncate group-hover:text-gold transition-colors">
                              {c.nombre}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span
                                className={`mono text-[9px] tracking-[0.12em] uppercase px-1.5 h-4 rounded inline-flex items-center ${
                                  c.kind === "Empresa"
                                    ? "bg-[#7AB3D9]/10 text-[#7AB3D9] border border-[#7AB3D9]/20"
                                    : "bg-gold/10 text-gold border border-gold/20"
                                }`}
                              >
                                {c.kind}
                              </span>
                              <span className="mono text-[10px] text-[#555]">
                                {nProjects} proy.
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {c.direccion ? (
                          <div className="flex items-start gap-2 text-[12px] text-[#BBB] leading-snug max-w-[260px]">
                            <Icon
                              name="pin"
                              size={12}
                              className="text-[#555] mt-0.5 flex-shrink-0"
                            />
                            <span>
                              {c.direccion}
                              {c.codigo_postal && `, ${c.codigo_postal}`}
                              {c.ciudad && ` ${c.ciudad}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {c.telefono ? (
                          <a
                            href={`tel:${c.telefono.replace(/\s/g, "")}`}
                            className="mono text-[12px] text-text hover:text-gold"
                          >
                            {c.telefono}
                          </a>
                        ) : (
                          <span className="text-[12px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-[12px] text-text hover:text-gold truncate block max-w-[220px]"
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-[12px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 mono text-[11px] text-text-muted">
                        {c.nif_cif || "—"}
                      </td>
                      <td className="pl-3 pr-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(c)}
                            className="h-8 w-8 grid place-items-center rounded-[7px] border border-border text-text-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition"
                            title="Editar"
                          >
                            <Icon name="edit" size={12} />
                          </button>
                          <button
                            onClick={() => setDeleting(c)}
                            className="h-8 w-8 grid place-items-center rounded-[7px] border border-border text-text-muted hover:text-[#F39C8E] hover:border-state-danger/40 hover:bg-state-danger/10 transition"
                            title="Eliminar"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          onDelete={
            editing?.id
              ? () => {
                  if (
                    confirm(
                      `¿Eliminar el cliente "${editing.nombre}"? Se marcará como inactivo.`
                    )
                  ) {
                    handleDelete(editing.id!);
                  }
                }
              : undefined
          }
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
