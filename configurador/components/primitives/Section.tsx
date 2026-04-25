import type { ReactNode } from 'react';

export function Section({
  index,
  eyebrow,
  question,
  lead,
  children,
  id
}: {
  index: number;
  eyebrow: string;
  question: string;
  lead?: string;
  children: ReactNode;
  id?: string;
}) {
  const eyebrowText = `${String(index).padStart(2, '0')} — ${eyebrow}`;
  return (
    <section
      id={id}
      data-screen-label={`${String(index).padStart(2, '0')} ${eyebrow}`}
      style={{
        padding: 'var(--section-spacing) 0',
        borderTop: '1px solid var(--border-soft)'
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 32 }}>
        {eyebrowText}
      </div>
      <h2
        className="display"
        style={{
          fontSize: 'clamp(36px, 4.6vw, 64px)',
          lineHeight: 1.05,
          marginBottom: lead ? 20 : 56,
          maxWidth: 900,
          textWrap: 'balance' as 'balance'
        }}
      >
        {question}
      </h2>
      {lead && (
        <p
          style={{
            fontSize: 19,
            color: 'var(--text-muted)',
            maxWidth: 560,
            marginBottom: 56,
            lineHeight: 1.45
          }}
        >
          {lead}
        </p>
      )}
      {children}
    </section>
  );
}
