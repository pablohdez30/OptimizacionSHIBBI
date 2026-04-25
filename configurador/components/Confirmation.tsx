'use client';

export function Confirmation({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px',
        animation: 'fadeIn 400ms ease'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <div className="eyebrow" style={{ marginBottom: 32 }}>Solicitud enviada</div>
        <h2
          className="display"
          style={{
            fontSize: 'clamp(48px, 7vw, 88px)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            marginBottom: 32
          }}
        >
          Recibido.
        </h2>
        <p style={{ fontSize: 19, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 64 }}>
          Te respondemos en menos de 24 horas
          <br />
          con el presupuesto cerrado.
        </p>
        <div style={{ width: 80, height: 1, background: 'var(--border)', margin: '0 auto 48px' }} />
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 8 }}>
          Mientras tanto, sígueme el rollo en Instagram.
        </p>
        <p className="display" style={{ fontSize: 28 }}>@shibbishop</p>
        <button
          onClick={onReset}
          style={{
            marginTop: 64,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: 4
          }}
        >
          Empezar otra solicitud
        </button>
      </div>
    </div>
  );
}
