'use client';

import { useEffect, useState } from 'react';
import { Section } from '@/components/primitives/Section';
import { MaterialImage } from '@/components/primitives/MaterialImage';
import { COMPONENTES } from '@/lib/catalogo';
import type { Configuracion } from '@/lib/types';

export function PatasSection({
  config,
  update
}: {
  config: Configuracion;
  update: (partial: Partial<Configuracion>) => void;
}) {
  const patas = COMPONENTES.filter((c) => c.categoria === 'pata');
  const sel = config.componentes[0];
  const selectedComp = sel ? patas.find((p) => p.id === sel.id) : null;
  const displayed = selectedComp || patas[0];

  const [shown, setShown] = useState(displayed);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    if (displayed && displayed.id !== shown?.id) {
      setFade(0);
      const t = setTimeout(() => {
        setShown(displayed);
        setFade(1);
      }, 180);
      return () => clearTimeout(t);
    }
  }, [displayed, shown]);

  function selectPata(pata: (typeof patas)[number]) {
    update({ componentes: [{ id: pata.id, cantidad: pata.unidad_default }] });
  }

  function setCantidad(n: number) {
    if (!sel) return;
    update({ componentes: [{ ...sel, cantidad: n }] });
  }

  return (
    <Section index={3} eyebrow="Las patas" question="Cómo se sostiene.">
      <div className="material-split">
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <div style={{ opacity: fade, transition: 'opacity 250ms ease' }}>
            <MaterialImage label={shown?.placeholder || ''} ratio="4 / 5" />
          </div>
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <div role="radiogroup" style={{ borderTop: '1px solid var(--border-soft)' }}>
            {patas.map((p) => {
              const isSel = sel?.id === p.id;
              return (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={isSel}
                  onClick={() => selectPata(p)}
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
                        textDecoration: isSel ? 'underline' : 'none',
                        textUnderlineOffset: 6,
                        textDecorationThickness: 1
                      }}
                    >
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {p.descripcion}
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    {p.precio_unidad} €/ud
                  </div>
                </button>
              );
            })}
          </div>

          {selectedComp && sel && (
            <div style={{ marginTop: 40 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Cantidad</div>
              <div style={{ display: 'flex' }}>
                {selectedComp.unidad_opciones.map((u, i) => {
                  const isSel = sel.cantidad === u;
                  return (
                    <button
                      key={u}
                      onClick={() => setCantidad(u)}
                      style={{
                        flex: 1,
                        padding: '14px 0',
                        background: 'transparent',
                        borderBottom: `1px solid ${isSel ? 'var(--text)' : 'var(--border-soft)'}`,
                        borderLeft: i === 0 ? 0 : '1px solid var(--border-soft)',
                        fontSize: 16,
                        color: isSel ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: isSel ? 500 : 400
                      }}
                    >
                      {u} ud
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
