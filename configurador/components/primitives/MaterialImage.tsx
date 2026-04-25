import type { CSSProperties } from 'react';

export function MaterialImage({
  label,
  ratio = '1 / 1',
  style
}: {
  label: string;
  ratio?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: ratio,
        background: 'var(--accent-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 23px, rgba(29,29,31,0.025) 23px 24px)',
          pointerEvents: 'none'
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          position: 'relative',
          padding: '0 16px',
          textAlign: 'center'
        }}
      >
        {label}
      </span>
    </div>
  );
}
