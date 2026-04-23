"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import {
  getConfiguracion,
  setConfigValue,
  getCategoriasMaterial,
  crearCategoriaMaterial,
  eliminarCategoriaMaterial,
  getCategoriasMueble,
  crearCategoriaMueble,
  eliminarCategoriaMueble,
} from "@/lib/supabase";
import type { CategoriaMaterial, CategoriaMueble } from "@/lib/types";

type ConfigMap = Record<string, string>;

function Card({
  num,
  icon,
  title,
  subtitle,
  children,
}: {
  num: string;
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/25 grid place-items-center text-gold">
          <Icon name={icon} size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mono text-[9px] tracking-[0.22em] text-[#555]">
            {num}
          </div>
          <div className="text-[15px] font-semibold text-text leading-tight mt-0.5">
            {title}
          </div>
        </div>
        {subtitle && (
          <span className="mono text-[10px] text-[#555]">{subtitle}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  hint,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[12px] font-medium text-text">{label}</label>
        {hint && <span className="mono text-[10px] text-[#555]">{hint}</span>}
      </div>
      <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3 hover:border-[#3a3a3a] transition">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text placeholder:text-[#555]"
        />
        {suffix && (
          <span className="ml-2 text-text-muted text-[11px] mono">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
}: {
  onClick: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-5 pt-4 border-t border-surface-2 flex justify-end">
      <button
        onClick={onClick}
        disabled={saving}
        className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
      >
        <Icon name="save" size={12} stroke={2.2} />
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

// ---------- Tag List (for categorías) ----------
function TagList({
  items,
  onRemove,
  onAdd,
  placeholder,
}: {
  items: { id: number; nombre: string }[];
  onRemove: (id: number) => void;
  onAdd: (nombre: string) => void;
  placeholder: string;
}) {
  const [val, setVal] = useState("");
  const submit = () => {
    const v = val.trim();
    if (!v) return;
    onAdd(v);
    setVal("");
  };
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
        {items.map((t) => (
          <span
            key={t.id}
            className="group h-8 pl-3 pr-1.5 rounded-lg border border-gold/30 bg-[#0E0E0E] flex items-center gap-2 text-[12px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-text">{t.nombre}</span>
            <button
              onClick={() => onRemove(t.id)}
              className="h-5 w-5 grid place-items-center rounded text-[#555] hover:text-state-danger hover:bg-state-danger/10"
            >
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-[12px] text-[#555] italic self-center">
            Sin categorías
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="ss-input flex-1 h-10 text-[13px]"
        />
        <button
          onClick={submit}
          disabled={!val.trim()}
          className="h-10 px-3.5 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
        >
          <Icon name="plus" size={12} stroke={2.4} /> Añadir
        </button>
      </div>
    </>
  );
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigMap>({});
  const [catsMat, setCatsMat] = useState<CategoriaMaterial[]>([]);
  const [catsMue, setCatsMue] = useState<CategoriaMueble[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadAll = async () => {
    const [cfg, mat, mue] = await Promise.all([
      getConfiguracion(),
      getCategoriasMaterial(),
      getCategoriasMueble(),
    ]);
    const map: ConfigMap = {};
    cfg.forEach((c) => (map[c.clave] = c.valor));
    setConfig(map);
    setCatsMat(mat);
    setCatsMue(mue);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const upd = (key: string, val: string) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const saveSection = async (keys: string[], sectionName: string) => {
    setSaving(sectionName);
    for (const k of keys) {
      if (config[k] !== undefined) {
        await setConfigValue(k, config[k]);
      }
    }
    setSaving(null);
  };

  const addCatMat = async (nombre: string) => {
    await crearCategoriaMaterial(nombre);
    loadAll();
  };
  const delCatMat = async (id: number) => {
    await eliminarCategoriaMaterial(id);
    loadAll();
  };
  const addCatMue = async (nombre: string) => {
    await crearCategoriaMueble(nombre);
    loadAll();
  };
  const delCatMue = async (id: number) => {
    await eliminarCategoriaMueble(id);
    loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="px-10 pt-10 pb-6">
        <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gold" />
          AJUSTES · SISTEMA
        </div>
        <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
          Configuración
        </h1>
        <p className="mt-3 text-[14px] text-text-muted">
          Precios, márgenes, datos de empresa y categorías.
        </p>
      </section>

      <section className="px-10 pb-10">
        <div className="grid grid-cols-2 gap-6">
          {/* 01 Precios y Márgenes */}
          <Card num="01" icon="euro" title="Precios y Márgenes" subtitle="Valores por defecto">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Precio hora mano obra *"
                value={config.precio_hora_mano_obra || ""}
                onChange={(v) => upd("precio_hora_mano_obra", v)}
                placeholder="25"
                suffix="€ / h"
                hint="Por hora imputada"
                wide
              />
              <Field
                label="Margen default *"
                value={config.margen_default || ""}
                onChange={(v) => upd("margen_default", v)}
                placeholder="100"
                suffix="%"
                hint="General"
              />
              <Field
                label="Margen cristal *"
                value={config.margen_cristal || ""}
                onChange={(v) => upd("margen_cristal", v)}
                placeholder="130"
                suffix="%"
                hint="Específico"
              />
              <Field
                label="IVA aplicable *"
                value={config.iva_porcentaje || ""}
                onChange={(v) => upd("iva_porcentaje", v)}
                placeholder="21"
                suffix="%"
              />
              <Field
                label="Días de validez *"
                value={config.dias_validez_default || ""}
                onChange={(v) => upd("dias_validez_default", v)}
                placeholder="15"
                suffix="días"
                hint="Desde emisión"
              />
            </div>
            <SaveButton
              saving={saving === "Precios"}
              onClick={() =>
                saveSection(
                  [
                    "precio_hora_mano_obra",
                    "margen_default",
                    "margen_cristal",
                    "iva_porcentaje",
                    "dias_validez_default",
                  ],
                  "Precios"
                )
              }
            />
          </Card>

          {/* 02 Datos de Empresa */}
          <Card num="02" icon="building" title="Datos de la Empresa" subtitle="Aparecen en PDFs">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Razón social *"
                value={config.empresa_nombre || ""}
                onChange={(v) => upd("empresa_nombre", v)}
                wide
              />
              <Field
                label="Nombre comercial"
                value={config.empresa_marca || ""}
                onChange={(v) => upd("empresa_marca", v)}
                wide
              />
              <Field
                label="Dirección *"
                value={config.empresa_direccion || ""}
                onChange={(v) => upd("empresa_direccion", v)}
              />
              <Field
                label="Ciudad · CP *"
                value={config.empresa_ciudad || ""}
                onChange={(v) => upd("empresa_ciudad", v)}
              />
              <Field
                label="CIF *"
                value={config.empresa_cif || ""}
                onChange={(v) => upd("empresa_cif", v)}
              />
              <Field
                label="Cuenta bancaria *"
                value={config.empresa_cuenta_bancaria || ""}
                onChange={(v) => upd("empresa_cuenta_bancaria", v)}
                hint="IBAN"
              />
              <Field
                label="Enlace Google Reviews"
                value={config.empresa_google_reviews || ""}
                onChange={(v) => upd("empresa_google_reviews", v)}
                hint="URL pública"
                wide
              />
            </div>
            <SaveButton
              saving={saving === "Empresa"}
              onClick={() =>
                saveSection(
                  [
                    "empresa_nombre",
                    "empresa_marca",
                    "empresa_direccion",
                    "empresa_ciudad",
                    "empresa_cif",
                    "empresa_cuenta_bancaria",
                    "empresa_google_reviews",
                  ],
                  "Empresa"
                )
              }
            />
          </Card>

          {/* 03 Categorías de Material */}
          <Card
            num="03"
            icon="tag"
            title="Categorías de Material"
            subtitle={`${catsMat.length} activas`}
          >
            <TagList
              items={catsMat}
              onAdd={addCatMat}
              onRemove={delCatMat}
              placeholder="Nueva categoría de material..."
            />
          </Card>

          {/* 04 Categorías de Mueble */}
          <Card
            num="04"
            icon="archive"
            title="Categorías de Mueble"
            subtitle={`${catsMue.length} activas`}
          >
            <TagList
              items={catsMue}
              onAdd={addCatMue}
              onRemove={delCatMue}
              placeholder="Nueva categoría de mueble..."
            />
          </Card>

          {/* 05 Ruta de Salida */}
          <Card num="05" icon="folder" title="Ruta de Salida" subtitle="Destino PDFs">
            <p className="text-[12px] text-text-muted mb-3">
              Carpeta base donde se guardan Presupuestos, Facturas y Desgloses.
            </p>
            <Field
              label="Ruta base"
              value={config.ruta_salida || ""}
              onChange={(v) => upd("ruta_salida", v)}
              placeholder="Dejar vacío para app/output/"
              wide
            />
            <p className="mt-3 text-[11px] text-[#555]">
              Estructura: <span className="mono">{"{ruta}/CAESPAN 2026/FACTURAS|PRESUPUESTOS|DESGLOSES/"}</span>
            </p>
            <SaveButton
              saving={saving === "Ruta"}
              onClick={() => saveSection(["ruta_salida"], "Ruta")}
            />
          </Card>

          {/* 06 Numeración */}
          <Card num="06" icon="hash" title="Numeración" subtitle="Último nº usado">
            <p className="text-[12px] text-text-muted mb-3">
              Indica el último número usado. La app generará el siguiente automáticamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Último Nº Presupuesto"
                value={config.ultimo_num_presupuesto || ""}
                onChange={(v) => upd("ultimo_num_presupuesto", v)}
                placeholder="26-XXX"
              />
              <Field
                label="Último Nº Factura"
                value={config.ultimo_num_factura || ""}
                onChange={(v) => upd("ultimo_num_factura", v)}
                placeholder="26-XXX"
              />
            </div>
            <SaveButton
              saving={saving === "Numeración"}
              onClick={() =>
                saveSection(
                  ["ultimo_num_presupuesto", "ultimo_num_factura"],
                  "Numeración"
                )
              }
            />
          </Card>

          {/* 07 Condiciones de pago */}
          <Card num="07" icon="file" title="Condiciones de Pago" subtitle="Texto PDF">
            <label className="text-[12px] font-medium text-text mb-1.5 block">
              Texto por defecto
            </label>
            <textarea
              value={config.condiciones_pago_default || ""}
              onChange={(e) => upd("condiciones_pago_default", e.target.value)}
              rows={3}
              className="ss-input w-full text-[13px] resize-none"
            />
            <SaveButton
              saving={saving === "Condiciones"}
              onClick={() =>
                saveSection(["condiciones_pago_default"], "Condiciones")
              }
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
