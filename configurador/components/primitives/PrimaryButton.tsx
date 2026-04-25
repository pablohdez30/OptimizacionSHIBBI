'use client';

import type { ReactNode } from 'react';

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  full = false,
  type = 'button'
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: 'var(--text)',
        color: 'var(--surface)',
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 500,
        padding: '18px 32px',
        borderRadius: 4,
        width: full ? '100%' : 'auto',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 100ms ease',
        letterSpacing: '0.01em'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '0.85';
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '1';
      }}
    >
      {loading ? 'Enviando…' : children}
    </button>
  );
}
