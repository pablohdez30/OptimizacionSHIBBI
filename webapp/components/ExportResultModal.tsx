"use client";

import { useEffect } from "react";
import Icon from "@/components/Icon";

/**
 * Muestra el resultado de una exportación (PDF/Excel) con una pantalla
 * dedicada — sustituye al alert() nativo del navegador.
 */
export default function ExportResultModal({
  archivos,
  errores,
  onClose,
}: {
  archivos: string[];
  errores: string[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasErrors = errores.length > 0;
  const hasSuccess = archivos.length > 0;

  const subtitle = hasErrors
    ? hasSuccess
      ? "Exportación parcial"
      : "No se pudo exportar"
    : "Archivos exportados";

  // Detectar el caso "archivo abierto" para mostrar una pista destacada
  const bloqueado = errores.some((e) =>
    /está abierto en otra aplicación|está abierto/i.test(e)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[14px] border border-border bg-surface-1 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-2 flex items-center justify-between">
          <div>
            <div
              className={`mono text-[10px] tracking-[0.2em] ${
                hasErrors && !hasSuccess
                  ? "text-[#F39C8E]"
                  : hasErrors
                  ? "text-gold"
                  : "text-[#6FBF8E]"
              }`}
            >
              {hasErrors && !hasSuccess
                ? "EXPORTACIÓN · ERROR"
                : hasErrors
                ? "EXPORTACIÓN · AVISO"
                : "EXPORTACIÓN · OK"}
            </div>
            <h3 className="text-[15px] font-semibold mt-0.5">{subtitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Destacado: archivo bloqueado */}
          {bloqueado && (
            <div className="rounded-lg border border-gold/40 bg-gold/10 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-gold/20 text-gold grid place-items-center flex-shrink-0">
                  <Icon name="info" size={15} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gold">
                    El archivo está abierto
                  </div>
                  <div className="text-[12px] text-text-muted mt-1 leading-relaxed">
                    Tienes el archivo abierto en Excel, Adobe Reader u otra
                    aplicación. Ciérralo y vuelve a pulsar Exportar.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Archivos generados */}
          {hasSuccess && (
            <div className="rounded-lg border border-state-success/30 bg-state-success/10 p-4">
              <div className="flex items-center gap-2 text-[#6FBF8E] font-semibold text-[12px] mb-2">
                <Icon name="check-circle" size={14} stroke={2.2} />
                {archivos.length} archivo{archivos.length > 1 ? "s" : ""}{" "}
                generado{archivos.length > 1 ? "s" : ""}
              </div>
              <ul className="space-y-1 text-[11px] text-text-muted mono break-all">
                {archivos.map((a, i) => (
                  <li key={i}>· {a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Errores */}
          {hasErrors && (
            <div className="rounded-lg border border-state-danger/30 bg-state-danger/10 p-4">
              <div className="flex items-center gap-2 text-[#F39C8E] font-semibold text-[12px] mb-2">
                <Icon name="info" size={14} />
                {errores.length === 1
                  ? "Incidencia"
                  : `${errores.length} incidencias`}
              </div>
              <ul className="space-y-2 text-[12px] text-text">
                {errores.map((e, i) => (
                  <li key={i} className="leading-relaxed">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-2 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-gold text-bg text-[12px] font-semibold hover:bg-gold-light"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
