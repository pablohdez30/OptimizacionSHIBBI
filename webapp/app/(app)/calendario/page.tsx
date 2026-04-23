"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import {
  getEventosCalendario,
  crearEventoCalendario,
  eliminarEventoCalendario,
} from "@/lib/supabase";
import type { EventoCalendario } from "@/lib/types";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Kind = "accepted" | "delivery" | "alert" | "reminder";
const KINDS: Record<Kind, { color: string; bg: string; border: string; dot: string; label: string }> = {
  accepted: { color: "#6FBF8E", bg: "rgba(111,191,142,.14)", border: "rgba(111,191,142,.35)", dot: "#6FBF8E", label: "Aceptado" },
  delivery: { color: "#7AB3D9", bg: "rgba(122,179,217,.14)", border: "rgba(122,179,217,.35)", dot: "#7AB3D9", label: "Entrega" },
  alert: { color: "#F39C8E", bg: "rgba(231,76,60,.14)", border: "rgba(231,76,60,.35)", dot: "#E74C3C", label: "Urgente" },
  reminder: { color: "#FAC51C", bg: "rgba(250,197,28,.12)", border: "rgba(250,197,28,.30)", dot: "#FAC51C", label: "Recordatorio" },
};

// Inferir tipo a partir del color del evento guardado en la BBDD
function kindFromColor(color: string | null | undefined): Kind {
  if (!color) return "reminder";
  const c = color.toLowerCase();
  if (c.includes("6fbf") || c.includes("2d6a4f") || c.includes("#2d6") || c === "#2d6a4f") return "accepted";
  if (c.includes("7ab3") || c.includes("0077")) return "delivery";
  if (c.includes("e74c") || c.includes("f39c") || c === "#e74c3c") return "alert";
  return "reminder";
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Cell = { day: number; outside: boolean; y: number; m: number };

function buildGrid(year: number, month: number): Cell[] {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) {
    const d = prevMonthDays - firstDow + 1 + i;
    cells.push({ day: d, outside: true, y: month === 0 ? year - 1 : year, m: month === 0 ? 11 : month - 1 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outside: false, y: year, m: month });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const d = last.outside ? last.day + 1 : cells.length - firstDow - daysInMonth + 1;
    const y = month === 11 ? year + 1 : year;
    const m = month === 11 ? 0 : month + 1;
    cells.push({ day: d, outside: true, y, m });
  }
  return cells.slice(0, 42);
}

type Selected = { key: string; day: number; y: number; m: number; outside: boolean };

// ---------- Event Pill (inside a day cell) ----------
function EventPill({ ev }: { ev: EventoCalendario }) {
  const k = KINDS[kindFromColor(ev.color)];
  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-1 rounded-[5px] text-[11px] leading-none truncate cursor-pointer transition hover:brightness-125"
      style={{ background: k.bg, border: `1px solid ${k.border}`, color: k.color }}
      title={`${k.label} · ${ev.titulo}`}
    >
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: k.dot }} />
      <span className="truncate font-medium">{ev.titulo}</span>
    </div>
  );
}

// ---------- New Event Modal ----------
function NewEventModal({
  defaultDate,
  onClose,
  onSaved,
}: {
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fecha: defaultDate,
    titulo: "",
    descripcion: "",
    kind: "reminder" as Kind,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    const color = KINDS[form.kind].dot;
    await crearEventoCalendario({
      fecha: form.fecha,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion,
      color,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[520px] max-w-full rounded-[14px] border border-border bg-surface-1 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">NUEVO EVENTO</div>
            <div className="text-[16px] font-semibold text-text mt-0.5">
              {form.fecha ? parseDateLabel(form.fecha) : "Selecciona una fecha"}
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
            <label className="text-[12px] font-medium text-text mb-2 block">Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {(["accepted", "delivery", "alert", "reminder"] as Kind[]).map((k) => {
                const v = KINDS[k];
                const active = form.kind === k;
                return (
                  <button
                    key={k}
                    onClick={() => setForm((f) => ({ ...f, kind: k }))}
                    className="h-9 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition border"
                    style={{
                      background: active ? v.bg : "transparent",
                      color: active ? v.color : "#888",
                      borderColor: active ? v.border : "#2A2A2A",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.dot }} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className="ss-input w-full h-10 text-[13px]"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">Título</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Entrega Mesa Lacada · Cliente"
              className="ss-input w-full h-10 text-[13px]"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-text mb-2 block">Notas</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="ss-input w-full text-[13px] resize-none"
              placeholder="Dirección, hora, observaciones..."
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
            disabled={saving || !form.titulo.trim() || !form.fecha}
            className="h-10 px-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
          >
            <Icon name="plus" size={13} stroke={2.2} />
            {saving ? "Guardando..." : "Crear evento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseDateLabel(iso: string) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  } catch {
    return iso;
  }
}

// ---------- Main Page ----------
export default function CalendarioPage() {
  const today = new Date();
  const [view, setView] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [events, setEvents] = useState<Record<string, EventoCalendario[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Selected>({
    key: ymd(today.getFullYear(), today.getMonth(), today.getDate()),
    day: today.getDate(),
    y: today.getFullYear(),
    m: today.getMonth(),
    outside: false,
  });
  const [creatingForDate, setCreatingForDate] = useState<string | null>(null);

  const TODAY = {
    y: today.getFullYear(),
    m: today.getMonth(),
    d: today.getDate(),
  };

  const loadEvents = async () => {
    setLoading(true);
    const list = await getEventosCalendario(view.y, view.m + 1);
    const byDay: Record<string, EventoCalendario[]> = {};
    list.forEach((e) => {
      const key = e.fecha.slice(0, 10);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(e);
    });
    setEvents(byDay);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [view.y, view.m]);

  const cells = useMemo(() => buildGrid(view.y, view.m), [view]);

  const prev = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const next = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  const goToday = () => {
    setView({ y: TODAY.y, m: TODAY.m });
    setSelected({
      key: ymd(TODAY.y, TODAY.m, TODAY.d),
      day: TODAY.d,
      y: TODAY.y,
      m: TODAY.m,
      outside: false,
    });
  };

  // Month stats
  const monthStats = useMemo(() => {
    const stats: Record<Kind, number> & { total: number } = {
      accepted: 0,
      delivery: 0,
      alert: 0,
      reminder: 0,
      total: 0,
    };
    Object.values(events).forEach((evs) => {
      evs.forEach((e) => {
        const k = kindFromColor(e.color);
        stats[k]++;
        stats.total++;
      });
    });
    return stats;
  }, [events]);

  // Upcoming (from today forward within visible month)
  const upcoming = useMemo(() => {
    const out: (EventoCalendario & { day: number })[] = [];
    Object.entries(events).forEach(([key, evs]) => {
      const [yy, mm, dd] = key.split("-").map(Number);
      const isVisibleMonth = yy === view.y && mm - 1 === view.m;
      const fromToday =
        view.y > TODAY.y ||
        (view.y === TODAY.y && view.m > TODAY.m) ||
        (view.y === TODAY.y && view.m === TODAY.m && dd >= TODAY.d);
      if (isVisibleMonth && fromToday) {
        evs.forEach((e) => out.push({ ...e, day: dd }));
      }
    });
    return out.sort((a, b) => a.day - b.day).slice(0, 5);
  }, [events, view]);

  const selectedEvents = events[selected.key] || [];

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="px-10 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              AGENDA · PLANIFICACIÓN
            </div>
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.025em]">
              Calendario
            </h1>
            <p className="mt-3 text-[14px] text-text-muted max-w-[560px]">
              Entregas, presupuestos aceptados y recordatorios. Haz clic en un
              día para ver el detalle o añadir un nuevo evento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="h-10 px-4 rounded-lg border border-border text-[13px] text-text-muted hover:text-text hover:border-[#3a3a3a] flex items-center gap-2"
            >
              <Icon name="calendar" size={14} /> Hoy
            </button>
            <button
              onClick={() => setCreatingForDate(selected.key)}
              className="h-10 pl-3.5 pr-4 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gold-light"
            >
              <Icon name="plus" size={14} stroke={2.4} /> Nuevo evento
            </button>
          </div>
        </div>
      </section>

      {/* Month navigator + legend */}
      <section className="px-10 pb-5">
        <div className="rounded-xl border border-border bg-surface-1 px-5 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="h-10 px-3 rounded-lg border border-border text-[13px] text-text-muted hover:text-text hover:border-[#3a3a3a] flex items-center gap-1.5"
            >
              <Icon name="chevron-left" size={14} /> Anterior
            </button>
            <div className="min-w-[220px] text-center">
              <div className="mono text-[9px] tracking-[0.25em] text-[#555]">
                MES EN VISTA
              </div>
              <div className="text-[22px] leading-tight font-semibold tracking-[-0.01em]">
                <span className="text-text">{MONTHS[view.m]}</span>{" "}
                <span className="gold-grad num">{view.y}</span>
              </div>
            </div>
            <button
              onClick={next}
              className="h-10 px-3 rounded-lg border border-border text-[13px] text-text-muted hover:text-text hover:border-[#3a3a3a] flex items-center gap-1.5"
            >
              Siguiente <Icon name="chevron-right" size={14} />
            </button>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex items-center gap-5 flex-wrap text-[12px]">
            {(["accepted", "delivery", "alert", "reminder"] as Kind[]).map(
              (k) => {
                const v = KINDS[k];
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: v.dot }}
                    />
                    <span className="text-text-muted">{v.label}</span>
                    <span className="mono text-[10px] text-[#555]">
                      · {monthStats[k] || 0}
                    </span>
                  </div>
                );
              }
            )}
          </div>

          <div className="flex-1" />

          <div className="text-right">
            <div className="mono text-[9px] tracking-[0.2em] text-[#555]">
              EVENTOS MES
            </div>
            <div className="num text-[22px] font-semibold text-text leading-none mt-0.5">
              {monthStats.total}
            </div>
          </div>
        </div>
      </section>

      {/* Calendar grid + side panel */}
      <section className="px-10 pb-10 grid grid-cols-12 gap-5">
        <div className="col-span-9">
          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-border bg-[#0A0A0A]">
              {DOW.map((d, i) => (
                <div
                  key={d}
                  className={`py-3 text-center mono text-[10px] tracking-[0.25em] font-medium ${
                    i >= 5 ? "text-gold" : "text-text-muted"
                  }`}
                >
                  {d.toUpperCase()}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 gap-px bg-surface-2">
              {cells.map((c, i) => {
                const key = ymd(c.y, c.m, c.day);
                const dayEvents = events[key] || [];
                const isToday =
                  c.y === TODAY.y && c.m === TODAY.m && c.day === TODAY.d;
                const isSel = selected.key === key;
                const isWeekend =
                  ((new Date(c.y, c.m, c.day).getDay() + 6) % 7) >= 5;

                return (
                  <button
                    key={i}
                    onClick={() =>
                      setSelected({
                        key,
                        day: c.day,
                        y: c.y,
                        m: c.m,
                        outside: c.outside,
                      })
                    }
                    className={`group text-left relative h-[128px] p-2 flex flex-col gap-1 transition-colors ${
                      c.outside
                        ? "bg-[#0B0B0B]"
                        : isWeekend
                        ? "bg-[#0E0E0E]"
                        : "bg-surface-1"
                    } ${isSel && !c.outside ? "bg-surface-2" : ""} hover:bg-surface-2`}
                  >
                    {isToday && (
                      <span className="absolute inset-1 rounded-lg border border-gold today-pulse pointer-events-none" />
                    )}
                    {isSel && !isToday && !c.outside && (
                      <span className="absolute inset-1 rounded-lg border border-gold/50 pointer-events-none" />
                    )}

                    <div className="flex items-center justify-between relative z-10">
                      <span
                        className={`num text-[15px] font-semibold tracking-tight ${
                          c.outside
                            ? "text-[#3a3a3a]"
                            : isToday
                            ? "text-gold"
                            : "text-text"
                        }`}
                      >
                        {pad(c.day)}
                      </span>
                      {dayEvents.length > 0 && !c.outside && (
                        <span className="mono text-[9px] tracking-[0.1em] text-[#555] group-hover:text-text-muted">
                          {dayEvents.length} EV
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 overflow-hidden relative z-10">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <EventPill key={ev.id} ev={ev} />
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-text-muted mono pl-1">
                          +{dayEvents.length - 3} más
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="col-span-3 space-y-4">
          {/* Selected day */}
          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-2 flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gold/10 border border-gold/30 grid place-items-center">
                <span className="num text-[22px] font-semibold text-gold leading-none">
                  {pad(selected.day)}
                </span>
              </div>
              <div>
                <div className="mono text-[10px] tracking-[0.18em] text-gold">
                  {DOW[
                    (new Date(selected.y, selected.m, selected.day).getDay() + 6) % 7
                  ].toUpperCase()}
                </div>
                <div className="text-[15px] font-medium text-text mt-0.5">
                  {MONTHS[selected.m]} {selected.y}
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {selectedEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="mx-auto h-10 w-10 rounded-full bg-surface-2 grid place-items-center mb-2">
                    <Icon name="calendar" size={14} className="text-[#555]" />
                  </div>
                  <div className="text-[12px] text-text-muted mb-3">
                    Sin eventos este día
                  </div>
                  <button
                    onClick={() => setCreatingForDate(selected.key)}
                    className="text-[11px] mono tracking-[0.12em] text-gold hover:text-gold-light"
                  >
                    + AÑADIR EVENTO
                  </button>
                </div>
              ) : (
                <>
                  {selectedEvents.map((ev) => {
                    const k = KINDS[kindFromColor(ev.color)];
                    return (
                      <div
                        key={ev.id}
                        className="rounded-lg border border-surface-2 bg-[#0E0E0E] p-3 hover:border-border transition group/event"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="mono text-[9px] tracking-[0.15em] uppercase px-1.5 h-4 rounded grid place-items-center"
                            style={{
                              background: k.bg,
                              color: k.color,
                              border: `1px solid ${k.border}`,
                            }}
                          >
                            {k.label}
                          </span>
                          {ev.descripcion && (
                            <span className="text-[11px] text-[#555] flex items-center gap-1">
                              <Icon name="clock" size={10} /> {ev.descripcion}
                            </span>
                          )}
                          <div className="flex-1" />
                          <button
                            onClick={async () => {
                              if (!confirm("¿Eliminar este evento?")) return;
                              await eliminarEventoCalendario(ev.id);
                              loadEvents();
                            }}
                            className="opacity-0 group-hover/event:opacity-100 text-[#555] hover:text-state-danger transition"
                            title="Eliminar"
                          >
                            <Icon name="trash" size={11} />
                          </button>
                        </div>
                        <div className="text-[13px] text-text leading-snug">
                          {ev.titulo}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setCreatingForDate(selected.key)}
                    className="w-full mt-2 h-9 rounded-lg border border-dashed border-border text-[12px] text-text-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 flex items-center justify-center gap-1.5 transition"
                  >
                    <Icon name="plus" size={12} stroke={2.2} /> Añadir evento a este día
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-2 flex items-center justify-between">
              <span className="mono text-[10px] tracking-[0.18em] text-text-muted">
                PRÓXIMOS · ESTE MES
              </span>
              <span className="mono text-[10px] text-[#555]">
                {upcoming.length}
              </span>
            </div>
            <div className="p-3 space-y-1">
              {upcoming.map((ev) => {
                const k = KINDS[kindFromColor(ev.color)];
                return (
                  <div
                    key={ev.id}
                    onClick={() =>
                      setSelected({
                        key: ev.fecha.slice(0, 10),
                        day: ev.day,
                        y: view.y,
                        m: view.m,
                        outside: false,
                      })
                    }
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 transition cursor-pointer"
                  >
                    <div
                      className="h-9 w-9 rounded-lg flex-shrink-0 grid place-items-center"
                      style={{ background: k.bg, border: `1px solid ${k.border}` }}
                    >
                      <span
                        className="num text-[12px] font-semibold"
                        style={{ color: k.color }}
                      >
                        {pad(ev.day)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-text truncate">
                        {ev.titulo}
                      </div>
                      {ev.descripcion && (
                        <div className="text-[10px] text-[#555] mono truncate">
                          {ev.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {upcoming.length === 0 && (
                <div className="py-4 text-center text-[11px] text-[#555]">
                  Nada más este mes.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

      {creatingForDate && (
        <NewEventModal
          defaultDate={creatingForDate}
          onClose={() => setCreatingForDate(null)}
          onSaved={() => {
            setCreatingForDate(null);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}
