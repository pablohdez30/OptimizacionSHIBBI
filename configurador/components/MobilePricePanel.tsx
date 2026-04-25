'use client';

import { useMemo, useState } from 'react';
import { calcularEstimacion } from '@/lib/pricing';
import { formatEUR } from '@/lib/format';
import { PricePanel } from './PricePanel';
import type { Configuracion } from '@/lib/types';

export function MobilePricePanel({ config }: { config: Configuracion }) {
  const { total } = useMemo(() => calcularEstimacion(config), [config]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="show-mobile"
        aria-label="Ver desglose del precio"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 52,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-soft)',
          zIndex: 50,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.04)',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>Total</span>
          <span className="display" style={{ fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {formatEUR(total, { decimals: 0 })}
            <span style={{ fontSize: '65%', color: 'var(--text-muted)', marginLeft: 2 }}>€</span>
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          Desglose
          <span aria-hidden style={{ fontSize: 14 }}>↑</span>
        </span>
      </button>

      {open && (
        <div
          className="show-mobile"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(29,29,31,0.4)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--background)',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              animation: 'slideUp 280ms cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '16px 20px 32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '8px 4px'
                }}
              >
                Cerrar ✕
              </button>
            </div>
            <PricePanel config={config} />
          </div>
        </div>
      )}
    </>
  );
}
