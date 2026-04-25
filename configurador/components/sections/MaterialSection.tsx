'use client';

import { useEffect, useState } from 'react';
import { Section } from '@/components/primitives/Section';
import { MaterialImage } from '@/components/primitives/MaterialImage';
import { MATERIALES } from '@/lib/catalogo';
import type { Configuracion } from '@/lib/types';

export function MaterialSection({
  config,
  update
}: {
  config: Configuracion;
  update: (partial: Partial<Configuracion>) => void;
}) {
  const aplicables = MATERIALES.filter((m) =>
    config.tipo ? m.aplicable_a.includes(config.tipo) : true
  );
  const selected = MATERIALES.find((m) => m.id === config.material_id);
  const showImg = selected || aplicables[0];

  const [displayed, setDisplayed] = useState(showImg);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    if (showImg && showImg.id !== displayed?.id) {
      setFade(0);
      const t = setTimeout(() => {
        setDisplayed(showImg);
        setFade(1);
      }, 180);
      return () => clearTimeout(t);
    }
  }, [showImg, displayed]);

  return (
    <Section index={2} eyebrow="El material" question="Elige la madera o el tablero.">
      <div className="material-split">
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <div style={{ opacity: fade, transition: 'opacity 250ms ease', width: '100%' }}>
            <MaterialImage label={displayed?.placeholder || ''} ratio="4 / 5" />
          </div>
        </div>

        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <div role="radiogroup" aria-label="Material" style={{ borderTop: '1px solid var(--border-soft)' }}>
            {aplicables.map((m) => {
              const sel = config.material_id === m.id;
              return (
                <button
                  key={m.id}
                  role="radio"
                  aria-checked={sel}
                  onClick={() =>
                    update({
                      material_id: m.id,
                      grosor:
                        config.grosor && m.grosor_opciones.includes(config.grosor)
                          ? config.grosor
                          : m.grosor_opciones[0]
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '20px 0',
                    borderBottom: '1px solid var(--border-soft)',
                    background: 'transparent',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 400,
                        textDecoration: sel ? 'underline' : 'none',
                        textUnderlineOffset: 6,
                        textDecorationThickness: 1
                      }}
                    >
                      {m.nombre}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {m.descripcion}
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {m.precio_m2} €/m²
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <div style={{ marginTop: 40 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Grosor</div>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                {selected.grosor_opciones.map((g, i) => {
                  const sel = config.grosor === g;
                  return (
                    <button
                      key={g}
                      onClick={() => update({ grosor: g })}
                      style={{
                        flex: 1,
                        padding: '14px 0',
                        background: 'transparent',
                        borderBottom: `1px solid ${sel ? 'var(--text)' : 'var(--border-soft)'}`,
                        borderLeft: i === 0 ? 0 : '1px solid var(--border-soft)',
                        fontSize: 16,
                        color: sel ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: sel ? 500 : 400,
                        transition: 'all 150ms ease'
                      }}
                    >
                      {g} cm
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
