"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { getConfiguracion, setConfigValue } from "@/lib/supabase";
import type { Configuracion } from "@/lib/types";

type ConfigMap = Record<string, string>;

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/25 grid place-items-center text-gold">
          <Icon name="settings" size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-text leading-tight">
            {title}
          </div>
          {subtitle && (
            <div className="mono text-[10px] text-[#555] mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
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
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="text-[12px] font-medium text-text mb-1.5 block">
        {label}
      </label>
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

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getConfiguracion().then((data) => {
      const map: ConfigMap = {};
      data.forEach((c) => (map[c.clave] = c.valor));
      setConfig(map);
      setLoading(false);
    });
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
    alert(`${sectionName} guardado correctamente.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Cargando configuración...
      </div>
    );
  }

  const preciosKeys = [
    "precio_hora_mano_obra",
    "margen_default",
    "margen_cristal",
    "iva_porcentaje",
    "dias_validez_default",
  ];
  const empresaKeys = [
    "empresa_nombre",
    "empresa_marca",
    "empresa_direccion",
    "empresa_ciudad",
    "empresa_cif",
    "empresa_cuenta_bancaria",
    "empresa_google_reviews",
  ];
  const numKeys = ["ultimo_num_presupuesto", "ultimo_num_factura"];

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
          Precios, márgenes, datos de empresa y más.
        </p>
      </section>

      <section className="px-10 pb-10">
        <div className="grid grid-cols-2 gap-6">
          {/* Precios y Márgenes */}
          <Card title="Precios y Márgenes">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Precio hora mano de obra"
                value={config.precio_hora_mano_obra || ""}
                onChange={(v) => upd("precio_hora_mano_obra", v)}
                placeholder="25"
                suffix="€/h"
              />
              <Field
                label="Margen por defecto"
                value={config.margen_default || ""}
                onChange={(v) => upd("margen_default", v)}
                placeholder="100"
                suffix="%"
              />
              <Field
                label="Margen cristal"
                value={config.margen_cristal || ""}
                onChange={(v) => upd("margen_cristal", v)}
                placeholder="130"
                suffix="%"
              />
              <Field
                label="IVA"
                value={config.iva_porcentaje || ""}
                onChange={(v) => upd("iva_porcentaje", v)}
                placeholder="21"
                suffix="%"
              />
              <Field
                label="Días validez presupuesto"
                value={config.dias_validez_default || ""}
                onChange={(v) => upd("dias_validez_default", v)}
                placeholder="15"
                suffix="días"
              />
            </div>
            <div className="mt-5 pt-4 border-t border-surface-2 flex justify-end">
              <button
                onClick={() => saveSection(preciosKeys, "Precios y Márgenes")}
                disabled={saving === "Precios y Márgenes"}
                className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
              >
                <Icon name="save" size={12} stroke={2.2} />
                {saving === "Precios y Márgenes" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </Card>

          {/* Datos de Empresa */}
          <Card title="Datos de la Empresa">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Razón social"
                value={config.empresa_nombre || ""}
                onChange={(v) => upd("empresa_nombre", v)}
                wide
              />
              <Field
                label="Nombre comercial"
                value={config.empresa_marca || ""}
                onChange={(v) => upd("empresa_marca", v)}
              />
              <Field
                label="CIF"
                value={config.empresa_cif || ""}
                onChange={(v) => upd("empresa_cif", v)}
              />
              <Field
                label="Dirección"
                value={config.empresa_direccion || ""}
                onChange={(v) => upd("empresa_direccion", v)}
                wide
              />
              <Field
                label="Ciudad / CP"
                value={config.empresa_ciudad || ""}
                onChange={(v) => upd("empresa_ciudad", v)}
              />
              <Field
                label="Cuenta bancaria"
                value={config.empresa_cuenta_bancaria || ""}
                onChange={(v) => upd("empresa_cuenta_bancaria", v)}
              />
              <Field
                label="Enlace Google Reviews"
                value={config.empresa_google_reviews || ""}
                onChange={(v) => upd("empresa_google_reviews", v)}
                wide
              />
            </div>
            <div className="mt-5 pt-4 border-t border-surface-2 flex justify-end">
              <button
                onClick={() => saveSection(empresaKeys, "Datos Empresa")}
                disabled={saving === "Datos Empresa"}
                className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
              >
                <Icon name="save" size={12} stroke={2.2} />
                {saving === "Datos Empresa" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </Card>

          {/* Numeración */}
          <Card title="Numeración" subtitle="Último número usado">
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
            <p className="mt-3 text-[11px] text-[#555]">
              La app generará el siguiente número automáticamente.
            </p>
            <div className="mt-4 pt-4 border-t border-surface-2 flex justify-end">
              <button
                onClick={() => saveSection(numKeys, "Numeración")}
                disabled={saving === "Numeración"}
                className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
              >
                <Icon name="save" size={12} stroke={2.2} />
                {saving === "Numeración" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </Card>

          {/* Condiciones de pago */}
          <Card title="Condiciones de Pago">
            <div>
              <label className="text-[12px] font-medium text-text mb-1.5 block">
                Texto por defecto
              </label>
              <textarea
                value={config.condiciones_pago_default || ""}
                onChange={(e) => upd("condiciones_pago_default", e.target.value)}
                rows={3}
                className="ss-input w-full text-[13px] resize-none"
              />
            </div>
            <div className="mt-4 pt-4 border-t border-surface-2 flex justify-end">
              <button
                onClick={() =>
                  saveSection(["condiciones_pago_default"], "Condiciones")
                }
                disabled={saving === "Condiciones"}
                className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
              >
                <Icon name="save" size={12} stroke={2.2} />
                {saving === "Condiciones" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
