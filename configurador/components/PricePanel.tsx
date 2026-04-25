'use client';

import { useEffect, useMemo, useState } from 'react';
import { calcularEstimacion } from '@/lib/pricing';
import { formatEUR } from '@/lib/format';
import type { Configuracion, DesgloseItem } from '@/lib/types';

export function PricePanel({ config }: { config: Configuracion }) {
  const { total, desglose } = useMemo(() => calcularEstimacion(config), [config]);
  const empty = desglose.length === 0;

  return (
    <aside
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
        padding: '28px 28px 32px'
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 20 }}>
        Tu mueble
      </div>
      <div style={{ borderTop: '1px solid var(--border-soft)' }} />

      <div style={{ minHeight: 120, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {empty && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Empieza a configurar y verás aquí el desglose en vivo.
          </div>
        )}
        {desglose.map((item) => (
          <PriceLine key={item.id} item={item} />
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)' }} />

      <div style={{ paddingTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Estimación</div>
        <div
          className="display"
          style={{
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: 4
          }}
        >
          <span>{formatEUR(total, { decimals: 0 })}</span>
          <span style={{ fontSize: '60%', color: 'var(--text-muted)' }}>€</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
          Estimación orientativa. Confirmamos el precio final tras revisar tu solicitud.
        </div>
      </div>
    </aside>
  );
}

function PriceLine({ item }: { item: DesgloseItem }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 20);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 200ms ease, transform 200ms ease'
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 400 }}>{item.titulo}</div>
        {item.subtitulo && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {item.subtitulo}
          </div>
        )}
      </div>
      <div className="mono" style={{ fontSize: 13, flexShrink: 0 }}>
        {formatEUR(item.importe)}
      </div>
    </div>
  );
}
