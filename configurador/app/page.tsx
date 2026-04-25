'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProgressRail } from '@/components/ProgressRail';
import { PricePanel } from '@/components/PricePanel';
import { MobilePricePanel } from '@/components/MobilePricePanel';
import { Confirmation } from '@/components/Confirmation';
import { Container } from '@/components/primitives/Container';
import { CategoriaSection } from '@/components/sections/CategoriaSection';
import { MaterialSection } from '@/components/sections/MaterialSection';
import { PatasSection } from '@/components/sections/PatasSection';
import { MedidasSection } from '@/components/sections/MedidasSection';
import { AcabadoSection } from '@/components/sections/AcabadoSection';
import { DatosSection } from '@/components/sections/DatosSection';
import { calcularEstimacion } from '@/lib/pricing';
import type { Configuracion } from '@/lib/types';

const CONFIG_INICIAL: Configuracion = {
  tipo: 'mesa',
  material_id: 'roble',
  grosor: 5,
  medidas: { largo: 150, ancho: 80, alto: 75 },
  componentes: [{ id: 'hairpin', cantidad: 4 }],
  acabado_id: 'aceite',
  servicios_ids: [],
  nombre: '',
  email: '',
  telefono: '',
  canal_preferido: 'email',
  notas_adicionales: '',
  imagenes: []
};

export default function Page() {
  const [config, setConfig] = useState<Configuracion>(CONFIG_INICIAL);
  const update = (partial: Partial<Configuracion>) => setConfig((c) => ({ ...c, ...partial }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Tracking de sección activa via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const m = visible.target.id?.match(/sec-(\d+)/);
          if (m) setActiveStep(parseInt(m[1], 10));
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    document.querySelectorAll("[id^='sec-']").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!config.nombre.trim()) e.nombre = 'Indícanos cómo te llamas.';
    if (!config.email.trim()) e.email = 'Necesitamos un email para responderte.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
      e.email = 'Revisa el formato del email.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    if (!validate()) {
      document.getElementById('sec-6')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSubmitting(true);

    // TODO: cuando esté Supabase + /api/solicitudes, sustituir este stub:
    //   const { total, desglose } = calcularEstimacion(config);
    //   const res = await fetch('/api/solicitudes', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ ...config, presupuesto_estimado: total, desglose })
    //   });
    //   if (!res.ok) { ...mostrar error... }
    const { total, desglose } = calcularEstimacion(config);
    console.log('[stub] Solicitud lista para enviar:', { ...config, presupuesto_estimado: total, desglose });

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  }

  function reset() {
    setSubmitted(false);
    setConfig(CONFIG_INICIAL);
    setErrors({});
    window.scrollTo({ top: 0 });
  }

  if (submitted) {
    return (
      <>
        <Header />
        <Confirmation onReset={reset} />
      </>
    );
  }

  return (
    <>
      <Header />
      <ProgressRail active={activeStep} />
      <Hero />

      <Container>
        <div className="layout-grid">
          <main style={{ minWidth: 0 }}>
            <div id="sec-1"><CategoriaSection config={config} update={update} /></div>
            <div id="sec-2"><MaterialSection config={config} update={update} /></div>
            <div id="sec-3"><PatasSection config={config} update={update} /></div>
            <div id="sec-4"><MedidasSection config={config} update={update} /></div>
            <div id="sec-5"><AcabadoSection config={config} update={update} /></div>
            <div id="sec-6">
              <DatosSection
                config={config}
                update={update}
                errors={errors}
                onSubmit={onSubmit}
                submitting={submitting}
              />
            </div>
          </main>
        </div>
      </Container>

      <aside className="price-col-fixed hide-mobile">
        <PricePanel config={config} />
      </aside>

      <MobilePricePanel config={config} />

      <footer
        style={{
          borderTop: '1px solid var(--border-soft)',
          padding: '48px 0 96px',
          marginTop: 96,
          marginBottom: 80
        }}
      >
        <Container>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div className="display" style={{ fontSize: 18 }}>Shibbi</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              shibbishop.com · Taller en España
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
}
