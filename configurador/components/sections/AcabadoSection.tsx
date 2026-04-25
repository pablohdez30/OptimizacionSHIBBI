'use client';

import { Section } from '@/components/primitives/Section';
import { RadioCircle } from '@/components/primitives/RadioCircle';
import { Switch } from '@/components/primitives/Switch';
import { ACABADOS, SERVICIOS } from '@/lib/catalogo';
import type { Configuracion } from '@/lib/types';

export function AcabadoSection({
  config,
  update
}: {
  config: Configuracion;
  update: (partial: Partial<Configuracion>) => void;
}) {
  const setAcabado = (id: string) =>
    update({ acabado_id: config.acabado_id === id ? null : id });

  const toggleServicio = (id: string) => {
    const cur = config.servicios_ids;
    update({
      servicios_ids: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    });
  };

  return (
    <Section index={5} eyebrow="El acabado" question="Cómo se trata la madera.">
      <div style={{ borderTop: '1px solid var(--border-soft)', maxWidth: 880 }}>
        {ACABADOS.map((a) => {
          const sel = config.acabado_id === a.id;
          return (
            <button
              key={a.id}
              role="radio"
              aria-checked={sel}
              onClick={() => setAcabado(a.id)}
              style={{
                width: '100%',
                padding: '22px 0',
                borderBottom: '1px solid var(--border-soft)',
                background: 'transparent',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 20
              }}
            >
              <RadioCircle checked={sel} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 400 }}>{a.nombre}</div>
              </div>
              <div
                className="hide-mobile"
                style={{ fontSize: 14, color: 'var(--text-muted)', flex: '0 1 320px' }}
              >
                {a.descripcion}
              </div>
              <div
                className="mono"
                style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0, minWidth: 70, textAlign: 'right' }}
              >
                {a.precio} €
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 80 }}>
        <div className="eyebrow" style={{ marginBottom: 24 }}>Servicios</div>
        <div style={{ borderTop: '1px solid var(--border-soft)', maxWidth: 880 }}>
          {SERVICIOS.map((s) => {
            const checked = config.servicios_ids.includes(s.id);
            return (
              <div
                key={s.id}
                style={{
                  padding: '20px 0',
                  borderBottom: '1px solid var(--border-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17 }}>{s.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {s.descripcion}
                  </div>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 14, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}
                >
                  {s.precio} €
                </div>
                <Switch checked={checked} onChange={() => toggleServicio(s.id)} label={s.nombre} />
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
