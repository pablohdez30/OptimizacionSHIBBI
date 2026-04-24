"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import {
  getDashboardStats,
  getPresupuestosRecientes,
  getProximasEntregas,
  getConfigValue,
} from "@/lib/supabase";
import { colorFromName, initials } from "@/lib/avatar";
import type { EventoCalendario } from "@/lib/types";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DAYS = [
  "domingo", "lunes", "martes", "miércoles",
  "jueves", "viernes", "sábado",
];
const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

function fmtMoney(v: number) {
  return (
    v.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function fmtPct(change: number, prev: number, curr: number) {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return "+" + curr;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// ---------- Sparkline ----------
function Sparkline({
  data,
  up = true,
  w = 140,
  h = 44,
}: {
  data: number[];
  up?: boolean;
  w?: number;
  h?: number;
}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const color = up ? "#FAC51C" : "#E74C3C";
  const gid = "spk" + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={w} height={h} className="overflow-visible block">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts.join(" ")} ${w},${h}`}
        fill={`url(#${gid})`}
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ---------- KPI card ----------
function Kpi({
  icon,
  label,
  value,
  delta,
  deltaType = "up",
  sub,
  sparkline,
  sparklineUp = true,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  delta?: string | null;
  deltaType?: "up" | "down" | "flat";
  sub?: string;
  sparkline?: number[];
  sparklineUp?: boolean;
  highlight?: boolean;
}) {
  const deltaColor =
    deltaType === "up"
      ? "#6FBF8E"
      : deltaType === "down"
      ? "#F39C8E"
      : "#888";
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 flex flex-col justify-between min-h-[168px] ${
        highlight
          ? "bg-gradient-to-b from-[#1a1405] to-surface-1 border-gold/30"
          : "bg-surface-1 border-border"
      }`}
    >
      {highlight && (
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-8 w-8 rounded-lg grid place-items-center ${
              highlight
                ? "bg-gold text-bg"
                : "bg-surface-2 text-text-muted border border-border"
            }`}
          >
            <Icon name={icon} size={15} />
          </div>
          <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
            {label}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`num text-[34px] leading-none font-semibold tracking-tight ${
              highlight ? "gold-grad" : "text-text"
            }`}
          >
            {value}
          </div>
          {delta && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium"
                style={{ color: deltaColor }}
              >
                {deltaType === "up" && (
                  <Icon name="arrow-up" size={11} stroke={2.2} />
                )}
                {deltaType === "down" && (
                  <Icon name="arrow-down" size={11} stroke={2.2} />
                )}
                {delta}
              </span>
              {sub && <span className="text-[11px] text-[#555]">{sub}</span>}
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} up={sparklineUp} />
        )}
      </div>
    </div>
  );
}

// ---------- Badge status (for quote rows) ----------
const STATUS_STYLES: Record<string, { dot: string; bg: string; fg: string; bd: string }> = {
  Borrador: { dot: "#888888", bg: "rgba(136,136,136,0.12)", fg: "#F5F5F5", bd: "rgba(136,136,136,0.3)" },
  Enviado: { dot: "#3498DB", bg: "rgba(52,152,219,0.10)", fg: "#8EC5EA", bd: "rgba(52,152,219,0.3)" },
  Aceptado: { dot: "#2D6A4F", bg: "rgba(45,106,79,0.14)", fg: "#6FBF8E", bd: "rgba(45,106,79,0.4)" },
  "En producción": { dot: "#FAC51C", bg: "rgba(250,197,28,0.10)", fg: "#FAC51C", bd: "rgba(250,197,28,0.35)" },
  Entregado: { dot: "#F5F5F5", bg: "rgba(245,245,245,0.06)", fg: "#F5F5F5", bd: "rgba(245,245,245,0.2)" },
  Rechazado: { dot: "#E74C3C", bg: "rgba(231,76,60,0.10)", fg: "#F39C8E", bd: "rgba(231,76,60,0.35)" },
};

function Badge({ estado }: { estado: string }) {
  const b = STATUS_STYLES[estado] || STATUS_STYLES.Borrador;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border font-medium h-6 px-2 text-[11px]"
      style={{ background: b.bg, color: b.fg, borderColor: b.bd }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.dot }} />
      {estado}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<EventoCalendario[]>([]);
  const [ivaPct, setIvaPct] = useState(21);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [s, q, e, iva] = await Promise.all([
        getDashboardStats(),
        getPresupuestosRecientes(6),
        getProximasEntregas(4),
        getConfigValue("iva_porcentaje"),
      ]);
      setStats(s);
      setQuotes(q);
      setEntregas(e);
      setIvaPct(parseFloat(iva || "21"));
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const todayStr = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}`;
  const hour = now.getHours();
  const saludo = hour < 14 ? "Buenos días" : hour < 21 ? "Buenas tardes" : "Buenas noches";

  // Deltas
  const presDelta = stats
    ? fmtPct(0, stats.presupuestosPrevMes, stats.presupuestosMes)
    : null;
  const facDelta = stats
    ? fmtPct(0, stats.facturadoPrevMes, stats.facturadoMes)
    : null;
  const tasaDelta = stats
    ? `${stats.tasaAceptacion - stats.tasaAceptacionPrev >= 0 ? "+" : ""}${stats.tasaAceptacion - stats.tasaAceptacionPrev} pp`
    : null;

  return (
    <div className="min-h-screen">
      {/* Hero greeting */}
      <section className="relative px-10 pt-10 pb-6">
        <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-3">
          <span className="h-1 w-1 rounded-full bg-gold" />
          <span className="uppercase">{todayStr}</span>
        </div>
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              {saludo}
              <span className="text-text-muted">.</span>
            </h1>
            <p className="mt-3 text-[15px] text-text-muted max-w-xl">
              {stats && (
                <>
                  Hoy tienes{" "}
                  <span className="text-text font-medium">
                    {stats.pendientesEntrega}{" "}
                    {stats.pendientesEntrega === 1
                      ? "presupuesto"
                      : "presupuestos"}
                  </span>{" "}
                  pendientes de entrega y{" "}
                  <span className="text-gold font-medium">
                    {entregas.length}{" "}
                    {entregas.length === 1 ? "entrega programada" : "entregas programadas"}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="px-10 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading || !stats ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-surface-1 min-h-[168px] animate-pulse"
                />
              ))}
            </>
          ) : (
            <>
              <Kpi
                icon="file"
                label="PRESUPUESTOS · MES"
                value={String(stats.presupuestosMes)}
                delta={presDelta || undefined}
                deltaType={
                  stats.presupuestosMes >= stats.presupuestosPrevMes
                    ? "up"
                    : "down"
                }
                sub="vs mes anterior"
              />
              <Kpi
                icon="coins"
                label="FACTURACIÓN · MES"
                value={fmtMoney(stats.facturadoMes)}
                delta={facDelta || undefined}
                deltaType={
                  stats.facturadoMes >= stats.facturadoPrevMes ? "up" : "down"
                }
                sub="vs mes anterior"
                highlight
              />
              <Kpi
                icon="percent"
                label="TASA DE ACEPTACIÓN"
                value={`${stats.tasaAceptacion}%`}
                delta={tasaDelta || undefined}
                deltaType={
                  stats.tasaAceptacion >= stats.tasaAceptacionPrev
                    ? "up"
                    : "down"
                }
                sub="vs mes anterior"
              />
              <Kpi
                icon="box"
                label="PENDIENTES DE ENTREGA"
                value={String(stats.pendientesEntrega)}
                delta={`${entregas.length} programadas`}
                deltaType="flat"
                sub="este mes"
              />
            </>
          )}
        </div>
      </section>

      {/* Main grid */}
      <section className="px-10 py-8 grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Recent quotes */}
        <div className="xl:col-span-3">
          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-2">
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight">
                  Presupuestos recientes
                </h3>
                <p className="text-[12px] text-text-muted mt-0.5">
                  Últimos 6 presupuestos
                </p>
              </div>
              <a
                href="/presupuestos"
                className="text-[12px] text-gold hover:text-gold-light flex items-center gap-1"
              >
                Ver todos <Icon name="chevron-right" size={13} />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0E0E0E] border-b border-border">
                  <tr>
                    {["Nº", "Cliente", "Proyecto", "Estado", "Total"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-6 py-3 mono text-[10px] tracking-[0.18em] text-text-muted font-medium ${
                            h === "Total" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-text-muted"
                      >
                        Cargando...
                      </td>
                    </tr>
                  ) : quotes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-text-muted"
                      >
                        Sin presupuestos.
                      </td>
                    </tr>
                  ) : (
                    quotes.map((r, i) => (
                      <QuoteRow
                        key={r.id}
                        r={r}
                        even={i % 2 === 1}
                        ivaPct={ivaPct}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming deliveries */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-2">
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight">
                  Próximas entregas
                </h3>
                <p className="text-[12px] text-text-muted mt-0.5">
                  {entregas.length}{" "}
                  {entregas.length === 1 ? "evento próximo" : "eventos próximos"}
                </p>
              </div>
              <a
                href="/calendario"
                className="h-7 w-7 grid place-items-center rounded-md border border-border text-text-muted hover:text-text hover:border-[#3a3a3a]"
              >
                <Icon name="calendar" size={14} />
              </a>
            </div>
            <ul className="flex-1 divide-y divide-surface-2">
              {loading ? (
                <li className="py-10 text-center text-text-muted">
                  Cargando...
                </li>
              ) : entregas.length === 0 ? (
                <li className="py-10 text-center text-text-muted text-[13px]">
                  Sin eventos programados.
                </li>
              ) : (
                entregas.map((e) => {
                  const d = e.fecha.slice(0, 10).split("-");
                  const day = d[2];
                  const mon = MONTHS_SHORT[parseInt(d[1], 10) - 1];
                  const soon =
                    new Date(e.fecha).getTime() - Date.now() <
                    3 * 86400000; // menos de 3 días
                  const c = soon ? "#FAC51C" : "#888";
                  return (
                    <li
                      key={e.id}
                      className="px-6 py-4 flex items-start gap-4 hover:bg-surface-2 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg border border-border bg-[#0E0E0E] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="mono text-[9px] tracking-[0.18em] text-text-muted leading-none">
                          {mon}
                        </span>
                        <span
                          className="num text-[18px] font-semibold leading-none mt-1"
                          style={{ color: soon ? "#FAC51C" : "#F5F5F5" }}
                        >
                          {day}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">
                          {e.titulo}
                        </div>
                        {e.descripcion && (
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
                            <Icon name="clock" size={11} />
                            <span className="truncate">{e.descripcion}</span>
                          </div>
                        )}
                      </div>
                      <span
                        className="mono text-[10px] tracking-[0.08em] uppercase px-2 h-6 rounded-full border flex items-center gap-1.5 flex-shrink-0"
                        style={{
                          color: c,
                          borderColor: c + "44",
                          background: c + "11",
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: c }}
                        />
                        {soon ? "Pronto" : "Programado"}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="px-6 py-4 border-t border-surface-2 flex items-center justify-between">
              <span className="mono text-[10px] tracking-[0.18em] text-[#555]">
                VISTA · AGENDA
              </span>
              <a
                href="/calendario"
                className="text-[12px] text-gold hover:text-gold-light flex items-center gap-1"
              >
                Abrir calendario <Icon name="chevron-right" size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------- Quote row (async loads total) ----------
function QuoteRow({
  r,
  even,
  ivaPct,
}: {
  r: any;
  even: boolean;
  ivaPct: number;
}) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { getTotalPresupuesto } = await import("@/lib/supabase");
      const base = await getTotalPresupuesto(r.id);
      setTotal(base * (1 + ivaPct / 100));
    })();
  }, [r.id, ivaPct]);

  const nombre = r.clientes?.nombre || "—";
  const col = colorFromName(nombre);

  return (
    <tr
      className={`border-b border-surface-2 last:border-b-0 hover:bg-surface-2 transition-colors ${
        even ? "bg-[#0E0E0E]" : ""
      }`}
    >
      <td className="px-6 py-3.5 mono text-[12px] text-text">
        {r.numero_presupuesto}
      </td>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-lg grid place-items-center text-[10px] font-semibold flex-shrink-0"
            style={{
              background: `${col.bg}20`,
              border: `1px solid ${col.bg}50`,
              color: col.bg,
            }}
          >
            {initials(nombre)}
          </div>
          <span className="text-[13px] truncate">{nombre}</span>
        </div>
      </td>
      <td className="px-6 py-3.5 text-[13px] text-text-muted max-w-[280px] truncate">
        {r.proyecto || "—"}
      </td>
      <td className="px-6 py-3.5">
        <Badge estado={r.estado} />
      </td>
      <td className="px-6 py-3.5 num text-[13px] font-semibold text-text text-right pr-8">
        {total === null ? "..." : fmtMoney(total)}
      </td>
    </tr>
  );
}
