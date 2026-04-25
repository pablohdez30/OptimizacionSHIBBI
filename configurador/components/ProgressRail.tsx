'use client';

const STEPS = [
  { id: 1, label: 'Categoría' },
  { id: 2, label: 'Material' },
  { id: 3, label: 'Patas' },
  { id: 4, label: 'Medidas' },
  { id: 5, label: 'Acabado' },
  { id: 6, label: 'Datos' }
];

export function ProgressRail({ active }: { active: number }) {
  return (
    <div
      className="progress-rail hide-mobile"
      style={{
        position: 'fixed',
        left: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }}
    >
      {STEPS.map((s) => {
        const isActive = active === s.id;
        const isPast = active > s.id;
        return (
          <a
            href={`#sec-${s.id}`}
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              opacity: isActive ? 1 : isPast ? 0.7 : 0.45,
              transition: 'all 200ms ease'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: isActive ? 24 : 12,
                height: 1,
                background: 'var(--text)',
                transition: 'width 200ms ease'
              }}
            />
            <span className="mono" style={{ fontSize: 11 }}>0{s.id}</span>
            {isActive && <span>{s.label}</span>}
          </a>
        );
      })}
    </div>
  );
}
