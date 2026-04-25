'use client';

import { useMemo } from 'react';
import { Section } from '@/components/primitives/Section';
import { LineInput } from '@/components/primitives/LineInput';
import type { Configuracion } from '@/lib/types';

export function MedidasSection({
  config,
  update
}: {
  config: Configuracion;
  update: (partial: Partial<Configuracion>) => void;
}) {
  const m = config.medidas;

  const setM = (k: 'largo' | 'ancho' | 'alto', v: string) => {
    const num: number | '' = v === '' ? '' : Math.max(0, parseInt(v, 10) || 0);
    update({ medidas: { ...m, [k]: num } });
  };

  const m2 = useMemo(() => {
    const l = (typeof m.largo === 'number' ? m.largo : 0) / 100;
    const a = (typeof m.ancho === 'number' ? m.ancho : 0) / 100;
    return l * a;
  }, [m.largo, m.ancho]);

  return (
    <Section
      index={4}
      eyebrow="Las medidas"
      question="Las medidas exactas."
      lead="Indícalas en centímetros. Si dudas, lo ajustamos contigo después."
    >
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, maxWidth: 880 }}
        className="medidas-grid"
      >
        <LineInput label="Largo" value={m.largo} onChange={(v) => setM('largo', v)} inputMode="numeric" suffix="cm" placeholder="150" />
        <LineInput label="Ancho" value={m.ancho} onChange={(v) => setM('ancho', v)} inputMode="numeric" suffix="cm" placeholder="80" />
        <LineInput label="Alto"  value={m.alto}  onChange={(v) => setM('alto', v)}  inputMode="numeric" suffix="cm" placeholder="75" />
      </div>
      <div className="mono" style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 32, letterSpacing: '0.01em' }}>
        {m2 > 0 ? `${m2.toFixed(2).replace('.', ',')} m² de superficie` : '—'}
      </div>
    </Section>
  );
}
