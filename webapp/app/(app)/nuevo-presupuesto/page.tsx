"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import {
  getClientes,
  getProveedores,
  getCategoriasMaterial,
  getCategoriasMueble,
  getConfigValue,
  crearCliente,
  crearPresupuesto,
  actualizarPresupuesto,
  getPresupuesto,
  getLineasPresupuesto,
  getDetallesCoste,
  agregarLineaPresupuesto,
  agregarDetalleCoste,
  eliminarLineasPresupuesto,
  sincronizarHistoricoMuebles,
  getMaterialesActualesProveedor,
  previewNumeroPresupuesto,
} from "@/lib/supabase";
import { exportPresupuesto } from "@/lib/export";
import ExportResultModal from "@/components/ExportResultModal";
import { toast } from "sonner";
import type {
  Cliente,
  Proveedor,
  CategoriaMaterial,
  CategoriaMueble,
} from "@/lib/types";

/* ---------------- Utilidades ---------------- */
function parseNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function fmt(n: number) {
  return (
    n.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Márgenes por defecto por categoría (reproduce DetailRow._DEFAULT_MARGINS del backend)
const DEFAULT_MARGINS: Record<string, string> = {
  Cristal: "35",
  "Envío/Porte": "0",
  Extras: "0",
};
const DEFAULT_MARGIN = "100";

// Clave de localStorage para el borrador activo (solo modo nuevo)
const DRAFT_KEY = "shibbi:nuevo-presupuesto:draft";

type Draft = {
  numero: string;
  general: {
    cliente_id: string;
    fecha: string;
    proyecto: string;
    porte: boolean;
    porteImporte: string;
    condiciones: string;
    notas: string;
  };
  furniture: Furniture[];
};

const PAYMENT_TERMS = [
  "50% adelanto - 50% antes de la entrega del trabajo.",
  "70% adelanto - 30% antes de la entrega del trabajo.",
  "100% adelanto.",
];

/* ---------------- Tipos internos ---------------- */
type Line = {
  uid: string;
  cat: string;        // nombre categoría material
  supplier: string;   // nombre proveedor o "" (manual)
  material: string;   // descripcion
  qty: string;
  price: string;
  margin: string;
};
type Furniture = {
  uid: string;
  catMueble: string;  // nombre categoría mueble
  name: string;
  desc: string;
  qty: string;
  collapsed?: boolean;
  lines: Line[];
};

/* ---------------- Primitivos UI ---------------- */
function Label({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[12px] font-medium text-text">
        {children} {required && <span className="text-gold">*</span>}
      </span>
      {hint && <span className="mono text-[10px] text-[#555]">{hint}</span>}
    </div>
  );
}

function InputShell({
  children,
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <div
      className={`ss-input-wrap flex items-center ${h} rounded-[8px] bg-[#0E0E0E] border border-border px-3 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 ${className}`}
    >
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  size = "md",
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  size?: "sm" | "md";
  suffix?: string;
}) {
  return (
    <InputShell size={size}>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 min-w-0 bg-transparent outline-none ${
          size === "sm" ? "text-[12px]" : "text-[13px]"
        } text-text placeholder:text-[#555]`}
      />
      {suffix && (
        <span className="ml-2 text-text-muted text-[11px] mono">{suffix}</span>
      )}
    </InputShell>
  );
}

function NumInput({
  value,
  onChange,
  suffix,
  size = "sm",
  align = "right",
}: {
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  size?: "sm" | "md";
  align?: "left" | "right";
}) {
  return (
    <InputShell size={size} className="!px-2.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 min-w-0 bg-transparent outline-none num text-[12px] text-text ${
          align === "right" ? "text-right" : ""
        }`}
      />
      {suffix && (
        <span className="ml-1 text-[#555] text-[10px] mono">{suffix}</span>
      )}
    </InputShell>
  );
}

function SelectBox<T extends { value: string | number; label: string }>({
  value,
  options,
  onChange,
  size = "md",
  placeholder,
}: {
  value: string | number | "";
  options: T[];
  onChange: (v: string) => void;
  size?: "sm" | "md";
  placeholder?: string;
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  const ts = size === "sm" ? "text-[12px]" : "text-[13px]";
  return (
    <div
      className={`ss-input-wrap relative flex items-center ${h} rounded-[8px] bg-[#0E0E0E] border border-border transition hover:border-[#3a3a3a]`}
    >
      <select
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none flex-1 min-w-0 h-full bg-transparent outline-none ${ts} text-text cursor-pointer pl-3 pr-8`}
      >
        {placeholder && (
          <option value="" className="bg-surface-1">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-1">
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}

/* ---------------- Fila de material ---------------- */
function MaterialRow({
  line,
  onChange,
  onDelete,
  stripe,
  catsMaterial,
  proveedores,
  materialesCache,
  loadMaterialesProveedor,
}: {
  line: Line;
  onChange: (l: Line) => void;
  onDelete: () => void;
  stripe: boolean;
  catsMaterial: CategoriaMaterial[];
  proveedores: Proveedor[];
  materialesCache: Record<number, any[]>;
  loadMaterialesProveedor: (id: number) => Promise<void>;
}) {
  const total =
    parseNum(line.qty) *
    parseNum(line.price) *
    (1 + parseNum(line.margin) / 100);

  const catOptions = catsMaterial.map((c) => ({ value: c.nombre, label: c.nombre }));
  const provOptions = [
    { value: "", label: "(manual)" },
    ...proveedores.map((p) => ({ value: p.nombre, label: p.nombre })),
  ];

  const provId = proveedores.find((p) => p.nombre === line.supplier)?.id;
  const materialesDeProv = (provId ? materialesCache[provId] : null) || null;

  const handleSupplierChange = async (nombre: string) => {
    onChange({ ...line, supplier: nombre, material: "" });
    if (!nombre) return;
    const p = proveedores.find((pp) => pp.nombre === nombre);
    if (p && !materialesCache[p.id]) {
      await loadMaterialesProveedor(p.id);
    }
  };

  const handleMaterialSelect = (desc: string) => {
    const mat = (materialesDeProv || []).find(
      (m) => m.descripcion_material === desc
    );
    if (mat) {
      onChange({
        ...line,
        material: desc,
        price: String(mat.precio),
        cat: mat.categorias_material?.nombre || line.cat,
      });
    } else {
      onChange({ ...line, material: desc });
    }
  };

  return (
    <tr
      className={`border-b border-surface-2 last:border-b-0 ${
        stripe ? "bg-[#0E0E0E]" : "bg-transparent"
      }`}
    >
      <td className="pl-4 pr-2 py-2 w-6 text-surface-2 hover:text-[#555] cursor-grab">
        <Icon name="grip" size={14} />
      </td>
      <td className="px-2 py-2 w-[140px]">
        <SelectBox
          size="sm"
          value={line.cat}
          options={catOptions}
          onChange={(v) => {
            const nuevoMargen = DEFAULT_MARGINS[v] ?? DEFAULT_MARGIN;
            onChange({ ...line, cat: v, margin: nuevoMargen });
          }}
        />
      </td>
      <td className="px-2 py-2 w-[160px]">
        <SelectBox
          size="sm"
          value={line.supplier}
          options={provOptions}
          onChange={handleSupplierChange}
        />
      </td>
      <td className="px-2 py-2 min-w-[220px]">
        {materialesDeProv && materialesDeProv.length > 0 ? (
          <SelectBox
            size="sm"
            placeholder="Material..."
            value={line.material}
            options={materialesDeProv.map((m) => ({
              value: m.descripcion_material,
              label: m.descripcion_material,
            }))}
            onChange={handleMaterialSelect}
          />
        ) : (
          <TextInput
            size="sm"
            value={line.material}
            onChange={(v) => onChange({ ...line, material: v })}
            placeholder="Material / descripción…"
          />
        )}
      </td>
      <td className="px-2 py-2 w-[80px]">
        <NumInput
          size="sm"
          value={line.qty}
          onChange={(v) => onChange({ ...line, qty: v })}
          suffix="u"
        />
      </td>
      <td className="px-2 py-2 w-[110px]">
        <NumInput
          size="sm"
          value={line.price}
          onChange={(v) => onChange({ ...line, price: v })}
          suffix="€"
        />
      </td>
      <td className="px-2 py-2 w-[90px]">
        <NumInput
          size="sm"
          value={line.margin}
          onChange={(v) => onChange({ ...line, margin: v })}
          suffix="%"
        />
      </td>
      <td className="px-2 py-2 w-[110px] text-right">
        <span className="num text-[12px] font-semibold text-text">
          {total.toFixed(2)} €
        </span>
      </td>
      <td className="pr-3 pl-1 py-2 w-8">
        <button
          onClick={onDelete}
          className="h-7 w-7 grid place-items-center rounded-[6px] text-[#555] hover:text-state-danger hover:bg-state-danger/10"
          aria-label="Eliminar línea"
        >
          <Icon name="x" size={14} />
        </button>
      </td>
    </tr>
  );
}

/* ---------------- Tarjeta de mueble ---------------- */
function FurnitureCard({
  f,
  index,
  onChange,
  onDelete,
  catsMueble,
  catsMaterial,
  proveedores,
  materialesCache,
  loadMaterialesProveedor,
  precioManoObra,
}: {
  f: Furniture;
  index: number;
  onChange: (f: Furniture) => void;
  onDelete: () => void;
  catsMueble: CategoriaMueble[];
  catsMaterial: CategoriaMaterial[];
  proveedores: Proveedor[];
  materialesCache: Record<number, any[]>;
  loadMaterialesProveedor: (id: number) => Promise<void>;
  precioManoObra: number;
}) {
  const updateLine = (uidLinea: string, newLine: Line) => {
    onChange({
      ...f,
      lines: f.lines.map((l) => (l.uid === uidLinea ? newLine : l)),
    });
  };
  const addLine = (cat = "Madera") => {
    const margin = DEFAULT_MARGINS[cat] ?? DEFAULT_MARGIN;
    const baseLine: Line = {
      uid: uid(),
      cat,
      supplier: "",
      material: "",
      qty: "1",
      price: "0",
      margin,
    };
    // Pre-rellenos: Mano de Obra
    if (cat === "Mano de Obra") {
      baseLine.material = "Mano de obra";
      baseLine.price = String(precioManoObra);
    }
    onChange({ ...f, lines: [...f.lines, baseLine] });
  };
  const deleteLine = (uidLinea: string) =>
    onChange({ ...f, lines: f.lines.filter((l) => l.uid !== uidLinea) });

  const cost = f.lines.reduce(
    (s, l) => s + parseNum(l.qty) * parseNum(l.price),
    0
  );
  const clientPerUnit = f.lines.reduce(
    (s, l) =>
      s + parseNum(l.qty) * parseNum(l.price) * (1 + parseNum(l.margin) / 100),
    0
  );
  const qty = parseNum(f.qty) || 1;

  const catMuebleOptions = catsMueble.map((c) => ({
    value: c.nombre,
    label: c.nombre,
  }));

  return (
    <div className="rounded-[12px] border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-2 bg-[#0E0E0E]">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-[8px] bg-gold/10 text-gold grid place-items-center flex-shrink-0">
            <Icon name="sofa" size={15} />
          </div>
          <span className="mono text-[10px] tracking-[0.18em] text-gold flex-shrink-0">
            MUEBLE · {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => onChange({ ...f, collapsed: !f.collapsed })}
            className="h-8 w-8 grid place-items-center rounded-[6px] text-[#555] hover:text-text-muted hover:bg-surface-2"
            aria-label={f.collapsed ? "Expandir" : "Contraer"}
          >
            <Icon name={f.collapsed ? "chevron-down" : "chevron-up"} size={15} />
          </button>
          <button
            onClick={onDelete}
            className="h-8 w-8 grid place-items-center rounded-[6px] text-text-muted hover:text-state-danger hover:bg-state-danger/10 border border-border hover:border-state-danger/40"
            aria-label="Eliminar mueble"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Inputs principales */}
        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-2">
            <Label>Categoría</Label>
            <SelectBox
              value={f.catMueble}
              options={catMuebleOptions}
              onChange={(v) => onChange({ ...f, catMueble: v })}
            />
          </div>
          <div className="col-span-3">
            <Label required>Nombre</Label>
            <TextInput
              value={f.name}
              onChange={(v) => onChange({ ...f, name: v })}
              placeholder="Ej. Mesa piramidal óxido"
            />
          </div>
          <div className="col-span-5">
            <Label hint="Enter para varias líneas">Descripción</Label>
            <textarea
              value={f.desc}
              onChange={(e) => onChange({ ...f, desc: e.target.value })}
              placeholder="Medidas: 120x100&#10;Acabado: lacado mate&#10;Material: roble"
              rows={3}
              className="ss-input-wrap w-full rounded-[8px] bg-[#0E0E0E] border border-border px-3 py-2 text-[13px] text-text placeholder:text-[#555] outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 resize-y leading-relaxed"
            />
          </div>
          <div className="col-span-2">
            <Label>Cantidad</Label>
            <InputShell>
              <input
                value={f.qty}
                onChange={(e) => onChange({ ...f, qty: e.target.value })}
                className="flex-1 min-w-0 bg-transparent outline-none num text-[13px] text-text text-right"
              />
              <span className="ml-2 text-[#555] text-[11px] mono">uds</span>
            </InputShell>
          </div>
        </div>
      </div>

      {!f.collapsed && (
        <>
          {/* Tabla de líneas */}
          <div className="px-2 pt-2">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="w-6" />
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    CATEGORÍA
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    PROVEEDOR
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    MATERIAL
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    CANT.
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    PRECIO UD.
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium">
                    MARGEN
                  </th>
                  <th className="px-2 pb-2 mono text-[9px] tracking-[0.2em] text-[#555] font-medium text-right">
                    TOTAL
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {f.lines.map((l, i) => (
                  <MaterialRow
                    key={l.uid}
                    line={l}
                    stripe={i % 2 === 1}
                    onChange={(nl) => updateLine(l.uid, nl)}
                    onDelete={() => deleteLine(l.uid)}
                    catsMaterial={catsMaterial}
                    proveedores={proveedores}
                    materialesCache={materialesCache}
                    loadMaterialesProveedor={loadMaterialesProveedor}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Añadir línea */}
          <div className="px-4 py-3">
            <button
              onClick={() => addLine()}
              className="w-full h-9 rounded-[8px] border border-dashed border-border text-[12px] text-text-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 flex items-center justify-center gap-1.5 transition"
            >
              <Icon name="plus" size={13} stroke={2.2} /> Añadir línea de material
            </button>
          </div>
        </>
      )}

      {/* Footer totales */}
      <div className="px-5 py-4 border-t border-surface-2 bg-[#0E0E0E] flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-6">
          <div>
            <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
              COSTE MATERIALES
            </div>
            <div className="num text-[15px] font-semibold text-text mt-0.5">
              {cost.toFixed(2)} €
            </div>
          </div>
          <div className="h-8 w-px bg-surface-2" />
          <div>
            <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
              LÍNEAS · UDS
            </div>
            <div className="num text-[13px] text-text-muted mt-0.5">
              {f.lines.length} líneas · {qty} uds
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[9px] tracking-[0.18em] text-gold">
            PRECIO CLIENTE
          </div>
          <div className="num text-[26px] leading-none font-semibold gold-grad mt-1">
            {(clientPerUnit * qty).toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Nuevo cliente inline modal ---------------- */
function NuevoClienteModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Cliente) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      const c = await crearCliente({
        nombre: nombre.trim(),
        direccion: "",
        ciudad: "",
        codigo_postal: "",
        telefono: "",
        email: "",
        nif_cif: "",
        notas: "",
      });
      onCreated(c);
      onClose();
    } catch (e) {
      toast.error("No se pudo crear el cliente", {
        description: (e as Error).message,
      });
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[12px] border border-border bg-surface-1 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold">Nuevo cliente rápido</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-md text-text-muted hover:text-text hover:bg-surface-2"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <Label required>Nombre</Label>
        <TextInput
          value={nombre}
          onChange={setNombre}
          placeholder="Ej. María Gómez"
        />
        <p className="text-[11px] text-text-muted mt-3">
          Podrás completar el resto de datos después desde Clientes.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border text-[12px] text-text-muted hover:text-text"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!nombre.trim() || saving}
            className="h-9 px-4 rounded-lg bg-gold text-bg text-[12px] font-semibold hover:bg-gold-light disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Página principal ---------------- */
function NuevoPresupuestoEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const presupuestoId = editId ? parseInt(editId, 10) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [wasLoaded, setWasLoaded] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [catsMaterial, setCatsMaterial] = useState<CategoriaMaterial[]>([]);
  const [catsMueble, setCatsMueble] = useState<CategoriaMueble[]>([]);

  const [ivaPct, setIvaPct] = useState(21);
  const [precioManoObra, setPrecioManoObra] = useState(25);

  const [numero, setNumero] = useState("");
  const [general, setGeneral] = useState({
    cliente_id: "",
    fecha: new Date().toISOString().slice(0, 10),
    proyecto: "",
    porte: false,
    porteImporte: "0",
    condiciones: PAYMENT_TERMS[0],
    notas: "",
  });
  const [furniture, setFurniture] = useState<Furniture[]>([]);

  // Cache materiales por proveedor
  const [materialesCache, setMaterialesCache] = useState<Record<number, any[]>>(
    {}
  );

  // Modal nuevo cliente
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [exportResult, setExportResult] = useState<{
    archivos: string[];
    errores: string[];
  } | null>(null);

  const loadMaterialesProveedor = async (id: number) => {
    if (materialesCache[id]) return;
    const mats = await getMaterialesActualesProveedor(id);
    setMaterialesCache((prev) => ({ ...prev, [id]: mats }));
  };

  /* --------- Carga inicial --------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cs, ps, cm, cmu, ivaV, phV] = await Promise.all([
          getClientes(),
          getProveedores(),
          getCategoriasMaterial(),
          getCategoriasMueble(),
          getConfigValue("iva_porcentaje"),
          getConfigValue("precio_hora_mano_obra"),
        ]);
        setClientes(cs);
        setProveedores(ps);
        setCatsMaterial(cm);
        setCatsMueble(cmu);
        setIvaPct(parseFloat(ivaV || "21"));
        setPrecioManoObra(parseFloat(phV || "25"));

        // Si hay borrador en localStorage (solo modo nuevo) lo restauramos
        if (!presupuestoId) {
          try {
            const raw =
              typeof window !== "undefined"
                ? window.localStorage.getItem(DRAFT_KEY)
                : null;
            if (raw) {
              const draft: Draft = JSON.parse(raw);
              setNumero(draft.numero || "");
              setGeneral(draft.general);
              setFurniture(draft.furniture || []);
              setDirty(true);
              setLoading(false);
              return;
            }
          } catch {
            /* draft corrupto → ignoramos */
          }
        }

        if (presupuestoId) {
          // Cargar presupuesto existente
          const pres = await getPresupuesto(presupuestoId);
          setNumero(pres.numero_presupuesto);
          setGeneral({
            cliente_id: String(pres.cliente_id),
            fecha: pres.fecha,
            proyecto: pres.proyecto || "",
            porte: !!pres.incluye_instalacion,
            porteImporte: String(pres.porte_importe ?? 0),
            condiciones: pres.condiciones_pago || PAYMENT_TERMS[0],
            notas: pres.notas_internas || "",
          });

          const lineas = await getLineasPresupuesto(presupuestoId);
          const muebles: Furniture[] = [];
          for (const l of lineas) {
            const dets = await getDetallesCoste(l.id);
            const lines: Line[] = dets.map((d: any) => ({
              uid: uid(),
              cat: d.categorias_material?.nombre || "",
              supplier: d.proveedores?.nombre || "",
              material: d.descripcion || "",
              qty: String(d.cantidad || 0),
              price: String(d.precio_unitario || 0),
              margin: String(l.margen_porcentaje ?? DEFAULT_MARGIN),
            }));
            muebles.push({
              uid: uid(),
              catMueble: l.categorias_mueble?.nombre || cmu[0]?.nombre || "Otros",
              name: l.nombre_producto || "",
              desc: l.descripcion || "",
              qty: String(l.cantidad || 1),
              lines,
            });
          }
          setFurniture(muebles);
          setWasLoaded(true);

          // Precalentar cache de materiales de los proveedores usados
          const provIds = new Set<number>();
          lineas.forEach((l: any) => {
            // no-op — resolver luego al hover; simple
          });
          provIds.forEach((pid) => {
            loadMaterialesProveedor(pid);
          });
        } else {
          // Borrador: cliente sin preseleccionar (forzamos elección consciente),
          // un mueble con 3 líneas típicas.
          // Previsualizar el Nº que se asignará
          try {
            setNumero(await previewNumeroPresupuesto());
          } catch {
            /* si falla, dejamos vacío */
          }
          const defaultMueble: Furniture = {
            uid: uid(),
            catMueble: cmu[0]?.nombre || "Otros",
            name: "",
            desc: "",
            qty: "1",
            lines: [
              {
                uid: uid(),
                cat: "Madera",
                supplier: "",
                material: "",
                qty: "1",
                price: "0",
                margin: DEFAULT_MARGIN,
              },
              {
                uid: uid(),
                cat: "Mano de Obra",
                supplier: "",
                material: "Mano de obra",
                qty: "1",
                price: String(parseFloat(phV || "25")),
                margin: DEFAULT_MARGIN,
              },
              {
                uid: uid(),
                cat: "Extras",
                supplier: "",
                material: "",
                qty: "1",
                price: "0",
                margin: DEFAULT_MARGINS["Extras"] ?? "0",
              },
            ],
          };
          setFurniture([defaultMueble]);
        }
      } catch (e) {
        toast.error("Error al cargar datos", {
          description: (e as Error).message,
        });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestoId]);

  /* --------- Autoguardado del borrador en localStorage (solo modo nuevo) --------- */
  useEffect(() => {
    if (loading || presupuestoId) return;
    if (typeof window === "undefined") return;
    const draft: Draft = { numero, general, furniture };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage lleno o bloqueado → se ignora */
    }
  }, [numero, general, furniture, loading, presupuestoId]);

  const limpiarDraft = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* noop */
      }
    }
  };

  /* --------- Cálculos --------- */
  const totals = useMemo(() => {
    let base = 0;
    furniture.forEach((f) => {
      const qty = parseNum(f.qty) || 1;
      const client = f.lines.reduce(
        (s, l) =>
          s +
          parseNum(l.qty) *
            parseNum(l.price) *
            (1 + parseNum(l.margin) / 100),
        0
      );
      base += client * qty;
    });
    const porte = general.porte ? parseNum(general.porteImporte) : 0;
    base += porte;
    const iva = base * (ivaPct / 100);
    return { base, iva, porte, total: base + iva };
  }, [furniture, ivaPct, general.porte, general.porteImporte]);

  /* --------- Handlers mueble --------- */
  const updateFurniture = (uidF: string, newF: Furniture) => {
    setFurniture((prev) => prev.map((f) => (f.uid === uidF ? newF : f)));
    setDirty(true);
  };
  const deleteFurniture = (uidF: string) => {
    setFurniture((prev) => prev.filter((f) => f.uid !== uidF));
    setDirty(true);
  };
  const addFurniture = () => {
    const nuevo: Furniture = {
      uid: uid(),
      catMueble: catsMueble[0]?.nombre || "Otros",
      name: "",
      desc: "",
      qty: "1",
      lines: [
        {
          uid: uid(),
          cat: "Madera",
          supplier: "",
          material: "",
          qty: "1",
          price: "0",
          margin: DEFAULT_MARGIN,
        },
      ],
    };
    setFurniture((prev) => [...prev, nuevo]);
    setDirty(true);
  };

  /* --------- Reset "+ Nuevo" --------- */
  const resetFormulario = async () => {
    if (dirty && !confirm("Tienes cambios sin guardar. ¿Vaciar de todos modos?"))
      return;
    limpiarDraft();
    if (presupuestoId) {
      router.push("/nuevo-presupuesto");
      return;
    }
    try {
      setNumero(await previewNumeroPresupuesto());
    } catch {
      setNumero("");
    }
    setGeneral({
      cliente_id: "",
      fecha: new Date().toISOString().slice(0, 10),
      proyecto: "",
      porte: false,
      porteImporte: "0",
      condiciones: PAYMENT_TERMS[0],
      notas: "",
    });
    setFurniture([
      {
        uid: uid(),
        catMueble: catsMueble[0]?.nombre || "Otros",
        name: "",
        desc: "",
        qty: "1",
        lines: [
          {
            uid: uid(),
            cat: "Madera",
            supplier: "",
            material: "",
            qty: "1",
            price: "0",
            margin: DEFAULT_MARGIN,
          },
        ],
      },
    ]);
    setDirty(false);
    setWasLoaded(false);
  };

  /* --------- Guardar --------- */
  const guardar = async (): Promise<number | null> => {
    if (!general.cliente_id) {
      toast.info("Selecciona un cliente válido.");
      return null;
    }
    if (furniture.length === 0) {
      toast.info("Añade al menos un mueble / producto.");
      return null;
    }

    if (wasLoaded) {
      const ok = confirm(
        "Estás editando un presupuesto que ya existía.\n\n¿Seguro que quieres guardar los cambios sobre él?\n(Si querías crear uno nuevo, pulsa 'Cancelar' y usa el botón '+ Nuevo')"
      );
      if (!ok) return null;
    }

    setSaving(true);
    try {
      const provMap: Record<string, number> = {};
      proveedores.forEach((p) => (provMap[p.nombre] = p.id));
      const catMatMap: Record<string, number> = {};
      catsMaterial.forEach((c) => (catMatMap[c.nombre] = c.id));
      const catMueMap: Record<string, number> = {};
      catsMueble.forEach((c) => (catMueMap[c.nombre] = c.id));

      const porteImporte = general.porte ? parseNum(general.porteImporte) : 0;

      let pid: number;
      if (presupuestoId) {
        // Update: cambiar campos y borrar líneas para reinsertarlas
        const campos: any = {
          cliente_id: parseInt(general.cliente_id, 10),
          proyecto: general.proyecto,
          notas_internas: general.notas,
          incluye_instalacion: general.porte ? 1 : 0,
          porte_importe: porteImporte,
          condiciones_pago: general.condiciones,
          fecha: general.fecha,
        };
        if (numero.trim()) campos.numero_presupuesto = numero.trim();
        await actualizarPresupuesto(presupuestoId, campos);
        await eliminarLineasPresupuesto(presupuestoId);
        pid = presupuestoId;
      } else {
        const nuevo = await crearPresupuesto({
          cliente_id: parseInt(general.cliente_id, 10),
          proyecto: general.proyecto,
          fecha: general.fecha,
          notas_internas: general.notas,
          condiciones_pago: general.condiciones,
          incluye_instalacion: general.porte,
          porte_importe: porteImporte,
          numero_presupuesto: numero.trim() || undefined,
        });
        pid = nuevo.id;
        setNumero(nuevo.numero_presupuesto);
      }

      // Insertar líneas y detalles
      for (let i = 0; i < furniture.length; i++) {
        const f = furniture[i];
        // Precio unitario final de la línea = precio cliente por unidad (suma sobre líneas internas aplicando margen)
        const precioUnitFinal = f.lines.reduce(
          (s, l) =>
            s +
            parseNum(l.qty) *
              parseNum(l.price) *
              (1 + parseNum(l.margin) / 100),
          0
        );
        // Margen representativo (media ponderada por coste, igual que backend usa uno por defecto)
        const margenRep = (() => {
          const totalCost = f.lines.reduce(
            (s, l) => s + parseNum(l.qty) * parseNum(l.price),
            0
          );
          if (totalCost === 0) return parseNum(DEFAULT_MARGIN);
          const weighted = f.lines.reduce(
            (s, l) =>
              s + parseNum(l.qty) * parseNum(l.price) * parseNum(l.margin),
            0
          );
          return weighted / totalCost;
        })();

        const linea = await agregarLineaPresupuesto({
          presupuesto_id: pid,
          nombre_producto: f.name.trim() || `Producto ${i + 1}`,
          descripcion: f.desc,
          cantidad: parseNum(f.qty) || 1,
          precio_unitario_final: precioUnitFinal,
          margen_porcentaje: margenRep,
          orden: i,
          categoria_mueble_id: catMueMap[f.catMueble] ?? null,
        });

        for (const l of f.lines) {
          // Saltar líneas completamente vacías
          if (
            parseNum(l.price) === 0 &&
            !l.material.trim() &&
            parseNum(l.qty) === 0
          ) {
            continue;
          }
          await agregarDetalleCoste({
            linea_presupuesto_id: linea.id,
            proveedor_id: l.supplier ? provMap[l.supplier] ?? null : null,
            categoria_material_id: catMatMap[l.cat] ?? null,
            descripcion: l.material,
            cantidad: parseNum(l.qty),
            precio_unitario: parseNum(l.price),
          });
        }
      }

      // Sincronizar histórico muebles
      await sincronizarHistoricoMuebles(pid);

      setDirty(false);
      setWasLoaded(true);
      // Draft consumido → lo borramos
      limpiarDraft();

      // Si era nuevo, llevar al modo edición con ?id=
      if (!presupuestoId) {
        router.replace(`/nuevo-presupuesto?id=${pid}`);
      }
      return pid;
    } catch (e: any) {
      toast.error("No se pudo guardar el presupuesto", {
        description:
          (e?.message || String(e)) +
          ". Puede que el Nº ya exista.",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const guardarYNotificar = async () => {
    const pid = await guardar();
    if (pid) toast.success("Presupuesto guardado correctamente");
  };

  const exportar = async () => {
    const pid = await guardar();
    if (!pid) return;
    try {
      const res = await exportPresupuesto(pid);
      setExportResult(res);
    } catch (e) {
      setExportResult({ archivos: [], errores: [(e as Error).message] });
    }
  };

  /* --------- Render --------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg/85 border-b border-surface-2">
        <div className="px-10 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2 text-[12px] mono text-[#555]">
            <span className="tracking-[0.18em]">SHIBBISHOP</span>
            <Icon name="chevron-right" size={12} />
            <span className="tracking-[0.18em]">PRESUPUESTOS</span>
            <Icon name="chevron-right" size={12} />
            <span className="text-text tracking-[0.18em]">
              {presupuestoId ? "EDITAR" : "NUEVO"}
            </span>
          </div>
          <div className="flex-1" />
          <span className="mono text-[11px] text-[#555] flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                dirty ? "bg-gold animate-pulse" : "bg-state-success/70"
              }`}
            />
            {dirty
              ? "BORRADOR · cambios sin guardar"
              : wasLoaded
              ? "GUARDADO"
              : "BORRADOR"}
          </span>
        </div>
      </header>

      {/* Page header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              {presupuestoId ? "EDICIÓN · PRESUPUESTO" : "CREACIÓN · PRESUPUESTO"}
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              {presupuestoId ? (
                <>
                  Presupuesto <span className="gold-grad">{numero}</span>
                </>
              ) : (
                "Nuevo Presupuesto"
              )}
            </h1>
            <p className="mt-3 text-[14px] text-text-muted max-w-xl">
              Define cliente, proyecto y los muebles a fabricar. El sistema
              calcula coste, margen e IVA en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFormulario}
              className="h-10 px-4 rounded-[8px] border border-border text-[13px] text-text-muted hover:text-text hover:bg-surface-1 hover:border-[#3a3a3a] flex items-center gap-2"
            >
              <Icon name="plus" size={14} /> Nuevo
            </button>
            <button
              onClick={guardarYNotificar}
              disabled={saving}
              className="h-10 px-4 rounded-[8px] border border-state-success/50 bg-state-success/15 text-[#6FBF8E] text-[13px] font-medium hover:bg-state-success/25 hover:border-state-success flex items-center gap-2 disabled:opacity-40"
            >
              <Icon name="save" size={14} /> {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={exportar}
              disabled={saving}
              className="glow-gold h-10 pl-3.5 pr-4 rounded-[8px] bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
            >
              <Icon name="download" size={14} stroke={2.2} /> Exportar Presupuesto
            </button>
          </div>
        </div>
      </section>

      {/* 01 · Datos generales */}
      <section className="px-10 pb-6">
        <div className="rounded-[12px] border border-border bg-surface-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
            <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
              01 · DATOS GENERALES
            </span>
            <div className="flex-1 h-px bg-surface-2" />
            <span className="mono text-[10px] text-[#555]">
              Campos obligatorios marcados con *
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <Label required>Cliente</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SelectBox
                      value={general.cliente_id}
                      options={clientes.map((c) => ({
                        value: c.id,
                        label: c.nombre,
                      }))}
                      onChange={(v) => {
                        setGeneral({ ...general, cliente_id: v });
                        setDirty(true);
                      }}
                      placeholder="Selecciona cliente..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNuevoCliente(true)}
                    className="h-10 px-3 rounded-[8px] border border-border text-[12px] text-text-muted hover:text-text hover:bg-surface-2 hover:border-[#3a3a3a] flex items-center gap-1.5"
                  >
                    <Icon name="plus" size={13} /> Cliente
                  </button>
                </div>
              </div>
              <div className="col-span-3">
                <Label hint={presupuestoId ? "Editable" : "Se asignará al guardar"}>
                  Nº Presupuesto
                </Label>
                <TextInput
                  value={numero}
                  onChange={(v) => {
                    setNumero(v);
                    setDirty(true);
                  }}
                  placeholder="YY-NNN"
                />
              </div>
              <div className="col-span-4">
                <Label required>Fecha</Label>
                <InputShell>
                  <Icon
                    name="calendar"
                    size={14}
                    className="mr-2 text-[#555]"
                  />
                  <input
                    type="date"
                    value={general.fecha}
                    onChange={(e) => {
                      setGeneral({ ...general, fecha: e.target.value });
                      setDirty(true);
                    }}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text [color-scheme:dark]"
                  />
                </InputShell>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-4">
              <div className="col-span-8">
                <Label required>Proyecto</Label>
                <TextInput
                  value={general.proyecto}
                  onChange={(v) => {
                    setGeneral({ ...general, proyecto: v });
                    setDirty(true);
                  }}
                  placeholder="Ej: Reforma cocina, Salón principal..."
                />
              </div>
              <div className="col-span-4">
                <Label hint={general.porte ? "Importe sin margen" : undefined}>
                  Porte / Instalación
                </Label>
                <div className="flex items-stretch gap-2">
                  <div className="ss-input-wrap h-10 flex-1 rounded-[8px] bg-[#0E0E0E] border border-border px-3 flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                      <input
                        type="checkbox"
                        className="ss-check"
                        checked={general.porte}
                        onChange={(e) => {
                          setGeneral({ ...general, porte: e.target.checked });
                          setDirty(true);
                        }}
                      />
                      <span
                        className={`text-[13px] ${
                          general.porte ? "text-text" : "text-text-muted"
                        }`}
                      >
                        {general.porte ? "Incluido" : "No incluido"}
                      </span>
                    </label>
                  </div>
                  {general.porte && (
                    <div className="ss-input-wrap h-10 w-28 rounded-[8px] bg-[#0E0E0E] border border-border pl-3 pr-2 flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={general.porteImporte}
                        onChange={(e) => {
                          setGeneral({
                            ...general,
                            porteImporte: e.target.value,
                          });
                          setDirty(true);
                        }}
                        className="flex-1 min-w-0 bg-transparent outline-none num text-[13px] text-text text-right"
                      />
                      <span className="ml-1 text-[#555] text-[11px] mono">€</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-4">
              <div className="col-span-6">
                <Label required>Condiciones de pago</Label>
                <SelectBox
                  value={general.condiciones}
                  options={PAYMENT_TERMS.map((p) => ({ value: p, label: p }))}
                  onChange={(v) => {
                    setGeneral({ ...general, condiciones: v });
                    setDirty(true);
                  }}
                />
              </div>
              <div className="col-span-6">
                <Label hint="No aparecen en el PDF del cliente">
                  Notas internas
                </Label>
                <TextInput
                  value={general.notas}
                  onChange={(v) => {
                    setGeneral({ ...general, notas: v });
                    setDirty(true);
                  }}
                  placeholder="Observaciones para taller, logística…"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 · Muebles */}
      <section className="px-10 pb-6">
        <div className="flex items-center gap-3 mb-4 px-1">
          <span className="mono text-[10px] tracking-[0.18em] text-gold">
            02 · MUEBLES
          </span>
          <div className="flex-1 h-px bg-surface-2" />
          <span className="mono text-[10px] text-[#555]">
            {furniture.length} mueble{furniture.length !== 1 ? "s" : ""} ·{" "}
            {furniture.reduce((s, f) => s + f.lines.length, 0)} líneas totales
          </span>
        </div>

        <div className="space-y-4">
          {furniture.map((f, i) => (
            <FurnitureCard
              key={f.uid}
              f={f}
              index={i}
              onChange={(nf) => updateFurniture(f.uid, nf)}
              onDelete={() => deleteFurniture(f.uid)}
              catsMueble={catsMueble}
              catsMaterial={catsMaterial}
              proveedores={proveedores}
              materialesCache={materialesCache}
              loadMaterialesProveedor={loadMaterialesProveedor}
              precioManoObra={precioManoObra}
            />
          ))}
        </div>

        <button
          onClick={addFurniture}
          className="mt-4 w-full h-14 rounded-[12px] border-2 border-dashed border-gold/30 bg-gold/[0.03] text-gold text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-gold/[0.08] hover:border-gold/60 transition"
        >
          <Icon name="plus" size={16} stroke={2.4} /> Añadir Mueble / Producto
        </button>
      </section>

      {/* 03 · Resumen */}
      <section className="px-10 pb-12">
        <div className="rounded-[12px] border border-border bg-gradient-to-b from-[#1a1405] to-surface-1 overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
          <div className="px-5 py-4 border-b border-gold/15 flex items-center gap-3 relative">
            <span className="mono text-[10px] tracking-[0.18em] text-gold">
              03 · RESUMEN
            </span>
            <div className="flex-1 h-px bg-gold/10" />
          </div>
          <div className="p-8 grid grid-cols-12 gap-8 relative">
            <div className="col-span-5 flex flex-col gap-4">
              <div
                className={`rounded-[10px] border px-4 py-3 flex items-start gap-3 ${
                  general.porte
                    ? "border-state-success/40 bg-state-success/10"
                    : "border-state-danger/35 bg-state-danger/10"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-[8px] grid place-items-center flex-shrink-0 ${
                    general.porte
                      ? "bg-state-success/25 text-[#6FBF8E]"
                      : "bg-state-danger/20 text-[#F39C8E]"
                  }`}
                >
                  <Icon
                    name={general.porte ? "check" : "info"}
                    size={15}
                    stroke={general.porte ? 2.4 : 1.6}
                  />
                </div>
                <div>
                  <div
                    className={`text-[13px] font-semibold ${
                      general.porte ? "text-[#6FBF8E]" : "text-[#F39C8E]"
                    }`}
                  >
                    {general.porte
                      ? `Porte / Instalación INCLUIDOS · ${fmt(
                          parseNum(general.porteImporte)
                        )}`
                      : "Porte / Instalación NO incluidos"}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                    {general.porte
                      ? "Aparece como línea independiente al final del presupuesto, sin margen."
                      : "El transporte y montaje se facturarán aparte según condiciones de logística."}
                  </div>
                </div>
              </div>
              <div className="rounded-[10px] border border-border bg-[#0E0E0E] px-4 py-3">
                <div className="mono text-[9px] tracking-[0.18em] text-[#555]">
                  CONDICIONES DE PAGO
                </div>
                <div className="text-[12px] text-text mt-1">
                  {general.condiciones}
                </div>
              </div>
              <div className="mono text-[10px] text-[#555] mt-auto">
                Válido durante 15 días desde la fecha de emisión. Los precios no
                incluyen modificaciones de obra civil.
              </div>
            </div>

            <div className="col-span-7">
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-text-muted">Base imponible</dt>
                  <dd className="num text-[17px] font-medium text-text">
                    {fmt(totals.base)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-text-muted">
                    IVA ({ivaPct.toFixed(0)}%)
                  </dt>
                  <dd className="num text-[17px] font-medium text-text">
                    {fmt(totals.iva)}
                  </dd>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-4" />
                <div className="flex items-end justify-between">
                  <div>
                    <div className="mono text-[11px] tracking-[0.2em] text-gold">
                      TOTAL · CLIENTE
                    </div>
                    <div className="text-[11px] text-[#555] mt-1">
                      IVA incluido · en euros
                    </div>
                  </div>
                  <dd className="num text-[56px] leading-none font-semibold tracking-tight gold-grad">
                    {fmt(totals.total)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex items-center gap-3 justify-end">
                <Link
                  href="/presupuestos"
                  className="h-10 px-4 rounded-[8px] border border-border text-[12px] text-text-muted hover:text-text hover:border-[#3a3a3a] flex items-center gap-2"
                >
                  <Icon name="chevron-left" size={13} /> Volver al listado
                </Link>
                <button
                  onClick={exportar}
                  disabled={saving}
                  className="glow-gold h-10 pl-3.5 pr-4 rounded-[8px] bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
                >
                  <Icon name="download" size={14} stroke={2.2} /> Exportar
                  Presupuesto
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-10 pb-10 pt-2 flex items-center justify-between text-[11px] mono text-[#555]">
        <span>SHIBBISHOP MANAGER · v2.0</span>
        <span>
          {dirty
            ? "Cambios sin guardar"
            : wasLoaded
            ? "Presupuesto guardado"
            : "Borrador en curso"}
        </span>
      </footer>

      {showNuevoCliente && (
        <NuevoClienteModal
          onClose={() => setShowNuevoCliente(false)}
          onCreated={(c) => {
            setClientes((prev) =>
              [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre))
            );
            setGeneral((g) => ({ ...g, cliente_id: String(c.id) }));
            setDirty(true);
          }}
        />
      )}

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

export default function NuevoPresupuestoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-text-muted">
          Cargando...
        </div>
      }
    >
      <NuevoPresupuestoEditor />
    </Suspense>
  );
}
