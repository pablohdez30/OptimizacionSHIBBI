"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import {
  getConfigValue,
  getLineasPresupuesto,
} from "@/lib/supabase";

type Props = {
  presupuestoId: number;
  numeroPresupuesto: string;
  clienteNombre: string;
  clienteEmail: string;
  onClose: () => void;
};

const FALLBACK_MARCA = "ShibbiShop";

function buildGmailComposeUrl(
  to: string,
  subject: string,
  body: string
): string {
  const params = new URLSearchParams({ view: "cm", to, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function buildMailto(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

export default function ResenaModal({
  presupuestoId,
  numeroPresupuesto,
  clienteNombre,
  clienteEmail,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState(clienteEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");

  const sinEmail = !clienteEmail || !clienteEmail.trim();

  useEffect(() => {
    (async () => {
      const [marcaRaw, googleUrlRaw, lineas] = await Promise.all([
        getConfigValue("empresa_marca"),
        getConfigValue("empresa_google_reviews"),
        getLineasPresupuesto(presupuestoId),
      ]);
      const marca = marcaRaw || FALLBACK_MARCA;
      const googleUrl = googleUrlRaw || "";
      setReviewUrl(googleUrl);

      const nombrePila =
        (clienteNombre || "cliente").split(/\s+/)[0] || "cliente";
      const nombresMuebles =
        lineas
          .map((l: any) => l.nombre_producto)
          .filter((n: string) => !!n)
          .join(", ") || "tu mueble";

      setSubject(`Tu opinión nos importa - ${marca}`);
      setBody(
        `Hola ${nombrePila},\n\n` +
          `Esperamos que estés disfrutando de ${nombresMuebles}.\n\n` +
          `Para nosotros tu opinión es muy importante. Si estás satisfecho con el trabajo, nos ayudaría mucho que nos dejases una valoración en Google:\n\n` +
          `${googleUrl}\n\n` +
          `¡Muchas gracias!\n` +
          `El equipo de ${marca}`
      );
      setLoading(false);
    })();
  }, [presupuestoId, clienteNombre]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleEnviarGmail = () => {
    const url = buildGmailComposeUrl(to.trim(), subject, body);
    window.open(url, "_blank", "noopener");
  };

  const handleMailto = () => {
    const url = buildMailto(to.trim(), subject, body);
    window.location.href = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-[14px] border border-border bg-surface-1 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-2 flex items-center justify-between">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] text-gold flex items-center gap-2">
              <Icon name="star" size={11} stroke={2.2} />
              PETICIÓN · RESEÑA
            </div>
            <h3 className="text-[16px] font-semibold mt-0.5">
              {clienteNombre}{" "}
              <span className="text-text-muted text-[13px] font-normal">
                · {numeroPresupuesto}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-2"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {sinEmail && (
            <div className="rounded-lg border border-state-danger/40 bg-state-danger/10 p-3 text-[12px] text-[#F39C8E]">
              <div className="flex items-start gap-2">
                <Icon name="info" size={13} className="mt-0.5 flex-shrink-0" />
                <div>
                  El cliente <strong>{clienteNombre}</strong> no tiene email
                  configurado. Añádelo en su ficha en{" "}
                  <a href="/clientes" className="underline hover:text-text">
                    Clientes
                  </a>{" "}
                  o introduce uno manualmente abajo.
                </div>
              </div>
            </div>
          )}

          {!loading && !reviewUrl && (
            <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-[12px] text-gold">
              <div className="flex items-start gap-2">
                <Icon name="info" size={13} className="mt-0.5 flex-shrink-0" />
                <div>
                  No has configurado el enlace de Google Reviews. Edítalo en{" "}
                  <a href="/configuracion" className="underline hover:text-text">
                    Configuración → Datos de la Empresa
                  </a>{" "}
                  para que aparezca en el correo.
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-text-muted text-[13px]">
              Cargando…
            </div>
          ) : (
            <>
              <div>
                <label className="text-[12px] font-medium text-text mb-1.5 block">
                  Para
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="email@cliente.com"
                  className="ss-input w-full text-[13px]"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text mb-1.5 block">
                  Asunto
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="ss-input w-full text-[13px]"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text mb-1.5 block">
                  Mensaje
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="ss-input w-full text-[13px] resize-none font-mono leading-relaxed"
                />
              </div>
              <p className="text-[11px] text-text-muted">
                Puedes editar el texto antes de enviarlo. "Abrir en Gmail" abre
                el correo redactado en una pestaña nueva.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-2 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border text-[12px] text-text-muted hover:text-text"
          >
            Cancelar
          </button>
          <button
            onClick={handleMailto}
            disabled={!to.trim() || loading}
            title="Usa tu cliente de correo predeterminado"
            className="h-9 px-3 rounded-lg border border-border text-[12px] text-text hover:bg-surface-2 hover:border-[#3a3a3a] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Icon name="mail" size={12} /> mailto:
          </button>
          <button
            onClick={handleEnviarGmail}
            disabled={!to.trim() || loading}
            className="h-9 pl-3 pr-4 rounded-lg bg-gold text-bg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light disabled:opacity-50"
          >
            <Icon name="external" size={12} /> Abrir en Gmail
          </button>
        </div>
      </div>
    </div>
  );
}
