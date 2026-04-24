"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";

type Item = {
  id: number;
  primary: string; // Nº presupuesto / factura
  secondary: string; // Cliente
  tertiary?: string; // Proyecto
};

type ExportResult = { archivos: string[]; errores: string[] };

export default function BatchExportModal({
  title,
  items,
  exportFn,
  onClose,
}: {
  title: string;
  items: Item[];
  exportFn: (id: number) => Promise<ExportResult>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    label: "",
  });
  const [done, setDone] = useState<{
    archivos: number;
    errores: string[];
  } | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const s = query.toLowerCase();
    return items.filter(
      (it) =>
        it.primary.toLowerCase().includes(s) ||
        it.secondary.toLowerCase().includes(s) ||
        (it.tertiary || "").toLowerCase().includes(s)
    );
  }, [items, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !running) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, running]);

  const toggle = (id: number) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((it) => selected.has(it.id));

  const toggleAll = () => {
    const n = new Set(selected);
    if (allFilteredSelected) {
      filtered.forEach((it) => n.delete(it.id));
    } else {
      filtered.forEach((it) => n.add(it.id));
    }
    setSelected(n);
  };

  const handleExport = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setRunning(true);
    setProgress({ current: 0, total: ids.length, label: "" });
    let totalArchivos = 0;
    const allErrores: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const it = items.find((x) => x.id === id);
      const label = it?.primary || String(id);
      setProgress({ current: i + 1, total: ids.length, label });
      try {
        const res = await exportFn(id);
        totalArchivos += res.archivos.length;
        res.errores.forEach((e) => allErrores.push(`${label}: ${e}`));
      } catch (e) {
        const msg = (e as Error).message || String(e);
        allErrores.push(`${label}: ${msg}`);
        // Error crítico (sin carpeta, sin permiso) → abortamos el lote
        if (/carpeta|permiso/i.test(msg)) {
          setRunning(false);
          setDone({ archivos: totalArchivos, errores: allErrores });
          return;
        }
      }
    }
    setRunning(false);
    setDone({ archivos: totalArchivos, errores: allErrores });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center px-4"
      onClick={() => !running && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-[14px] border border-border bg-surface-1 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-2 flex items-center justify-between">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              EXPORTAR
            </div>
            <h3 className="text-[16px] font-semibold mt-0.5">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-40"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {done ? (
          /* Resultado final */
          <div className="p-6">
            <div className="rounded-lg border border-state-success/30 bg-state-success/10 p-4 mb-3">
              <div className="text-[#6FBF8E] font-semibold text-[13px] mb-1">
                Exportación completada
              </div>
              <div className="text-text-muted text-[12px]">
                {done.archivos} archivo{done.archivos !== 1 ? "s" : ""} generado
                {done.archivos !== 1 ? "s" : ""}.
              </div>
            </div>
            {done.errores.length > 0 && (
              <div className="rounded-lg border border-state-danger/30 bg-state-danger/10 p-4 text-[12px] max-h-48 overflow-y-auto">
                <div className="text-[#F39C8E] font-semibold mb-2">
                  Errores ({done.errores.length}):
                </div>
                <ul className="space-y-1 text-text-muted">
                  {done.errores.map((e, i) => (
                    <li key={i}>· {e}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg bg-gold text-bg text-[12px] font-semibold hover:bg-gold-light"
              >
                OK
              </button>
            </div>
          </div>
        ) : running ? (
          /* Progreso */
          <div className="p-8">
            <div className="mono text-[10px] text-text-muted tracking-[0.15em] mb-2">
              GENERANDO ARCHIVOS
            </div>
            <div className="text-[14px] text-text">
              Exportando {progress.current} / {progress.total}
              {progress.label && (
                <>
                  <span className="text-text-muted"> · </span>
                  <span className="mono text-gold">{progress.label}</span>
                </>
              )}
            </div>
            <div className="mt-4 h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-200"
                style={{
                  width: `${
                    progress.total > 0
                      ? (progress.current / progress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        ) : (
          /* Selector */
          <>
            <div className="px-6 py-3 border-b border-surface-2">
              <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3">
                <Icon name="search" size={14} className="text-[#555] mr-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar Nº, cliente o proyecto..."
                  className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[#555]"
                />
              </div>
            </div>

            <div className="px-6 py-2 flex items-center gap-3 border-b border-surface-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="ss-check"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                />
                <span className="text-[12px] text-text-muted">
                  Seleccionar todos ({filtered.length})
                </span>
              </label>
              <div className="flex-1" />
              <span className="mono text-[11px] text-gold">
                {selected.size} seleccionados
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-text-muted text-[13px]">
                  Sin resultados
                </div>
              ) : (
                <ul className="divide-y divide-surface-2">
                  {filtered.map((it) => {
                    const isSel = selected.has(it.id);
                    return (
                      <li
                        key={it.id}
                        onClick={() => toggle(it.id)}
                        className={`px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface-2 ${
                          isSel ? "bg-gold/[0.04]" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="ss-check"
                          checked={isSel}
                          onChange={() => toggle(it.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-text truncate">
                            <span className="mono text-gold">{it.primary}</span>
                            {"  ·  "}
                            {it.secondary}
                          </div>
                          {it.tertiary && (
                            <div className="text-[11px] text-text-muted truncate mt-0.5">
                              {it.tertiary}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 border-t border-surface-2 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-border text-[12px] text-text-muted hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={selected.size === 0}
                className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-40"
              >
                <Icon name="download" size={12} />
                Exportar {selected.size > 0 ? `(${selected.size})` : ""}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
