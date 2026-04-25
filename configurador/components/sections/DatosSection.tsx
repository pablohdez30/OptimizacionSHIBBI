'use client';

import { useState } from 'react';
import { Section } from '@/components/primitives/Section';
import { LineInput } from '@/components/primitives/LineInput';
import { PrimaryButton } from '@/components/primitives/PrimaryButton';
import type { Configuracion } from '@/lib/types';

export function DatosSection({
  config,
  update,
  errors,
  onSubmit,
  submitting
}: {
  config: Configuracion;
  update: (partial: Partial<Configuracion>) => void;
  errors: Record<string, string>;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [drag, setDrag] = useState(false);

  const setField = <K extends keyof Configuracion>(k: K, v: Configuracion[K]) => update({ [k]: v } as Partial<Configuracion>);

  function onFiles(files: FileList | null) {
    const arr = Array.from(files || []).slice(0, 5);
    update({ imagenes: arr.map((f) => f.name) });
  }

  return (
    <Section
      index={6}
      eyebrow="Cuéntanos quién eres"
      question="Tus datos."
      lead="Te respondemos por email en menos de 24 horas con el presupuesto cerrado."
    >
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 48 }}>
        <LineInput
          label="Nombre"
          value={config.nombre}
          onChange={(v) => setField('nombre', v)}
          error={errors.nombre}
          placeholder="Pablo Hernández"
          required
          name="nombre"
        />
        <LineInput
          label="Email"
          type="email"
          value={config.email}
          onChange={(v) => setField('email', v)}
          error={errors.email}
          placeholder="pablo@correo.com"
          required
          name="email"
        />
        <LineInput
          label="Teléfono (opcional)"
          value={config.telefono}
          onChange={(v) => setField('telefono', v)}
          inputMode="tel"
          placeholder="+34 600 000 000"
          name="telefono"
        />

        <div style={{ marginTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Canal preferido</div>
          <div style={{ display: 'flex' }}>
            {(['email', 'whatsapp', 'cualquiera'] as const).map((opt, i) => {
              const sel = config.canal_preferido === opt;
              const label = opt === 'email' ? 'Email' : opt === 'whatsapp' ? 'WhatsApp' : 'Cualquiera';
              return (
                <button
                  key={opt}
                  onClick={() => setField('canal_preferido', opt)}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    background: 'transparent',
                    borderBottom: `1px solid ${sel ? 'var(--text)' : 'var(--border-soft)'}`,
                    borderLeft: i === 0 ? 0 : '1px solid var(--border-soft)',
                    fontSize: 15,
                    color: sel ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: sel ? 500 : 400
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Notas</div>
          <textarea
            value={config.notas_adicionales}
            onChange={(e) => setField('notas_adicionales', e.target.value)}
            placeholder="Cuéntanos cualquier detalle que importe (uso, espacio, fechas…)"
            rows={4}
            style={{
              width: '100%',
              border: 0,
              borderBottom: '1px solid var(--border-soft)',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              padding: '12px 0',
              outline: 0,
              resize: 'vertical',
              color: 'var(--text)'
            }}
          />
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Inspiración</div>
          <label
            onDragEnter={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFiles(e.dataTransfer.files);
            }}
            style={{
              display: 'block',
              padding: '44px 24px',
              border: `1px dashed ${drag ? 'var(--text)' : 'var(--border)'}`,
              background: drag ? 'var(--accent-bg)' : 'transparent',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <div style={{ fontSize: 15 }}>
              {config.imagenes.length
                ? `${config.imagenes.length} archivo${config.imagenes.length > 1 ? 's' : ''} seleccionado${config.imagenes.length > 1 ? 's' : ''}`
                : 'Arrastra fotos de inspiración aquí'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              JPG, PNG, WEBP — hasta 5 archivos
            </div>
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={onSubmit} loading={submitting} full>
            Enviar solicitud
          </PrimaryButton>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
            Al enviar aceptas que nos pongamos en contacto contigo.
          </div>
        </div>
      </div>
    </Section>
  );
}
