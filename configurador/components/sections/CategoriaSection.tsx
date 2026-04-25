'use client';

import { Section } from '@/components/primitives/Section';
import { MaterialImage } from '@/components/primitives/MaterialImage';
import { CATEGORIAS } from '@/lib/catalogo';
import type { Configuracion } from '@/lib/types';

export function CategoriaSection({
  config,
  update
}: {
  config: Configuracion;
  update: (partial: Partial<Configuracion>) => void;
}) {
  return (
    <Section index={1} eyebrow="Empieza por aquí" question="¿Qué quieres construir?">
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
        className="cat-grid"
        role="radiogroup"
        aria-label="Categoría"
      >
        {CATEGORIAS.map((cat) => {
          const selected = config.tipo === cat.id;
          return (
            <button
              key={cat.id}
              role="radio"
              aria-checked={selected}
              onClick={() => update({ tipo: cat.id })}
              style={{
                textAlign: 'left',
                padding: 0,
                background: selected ? 'var(--accent-bg)' : 'var(--surface)',
                border: `1px solid ${selected ? 'var(--text)' : 'var(--border-soft)'}`,
                borderRadius: 0,
                transition: 'border-color 150ms ease, background 150ms ease',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.borderColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.borderColor = 'var(--border-soft)';
              }}
            >
              <MaterialImage label={cat.placeholder} ratio="4 / 3" />
              <div style={{ padding: '20px 20px 24px', borderTop: '1px solid var(--border-soft)' }}>
                <div className="display" style={{ fontSize: 24, marginBottom: 4, letterSpacing: '-0.01em' }}>
                  {cat.nombre}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {cat.descripcion}
                </div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {cat.desde ? `Desde ${cat.desde} €` : 'A consultar'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {config.tipo && config.tipo !== 'mesa' && (
        <div
          style={{
            marginTop: 32,
            padding: '20px 24px',
            background: 'var(--accent-bg)',
            fontSize: 14,
            color: 'var(--text-muted)',
            maxWidth: 640
          }}
        >
          Has seleccionado{' '}
          <strong style={{ color: 'var(--text)' }}>
            {CATEGORIAS.find((c) => c.id === config.tipo)?.nombre}
          </strong>
          . El flujo guiado completo está disponible para mesa. Puedes seguir leyendo y enviarnos tus
          medidas en el último paso — te respondemos a medida.
        </div>
      )}
    </Section>
  );
}
