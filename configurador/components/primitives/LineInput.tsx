'use client';

import { useState } from 'react';

export function LineInput({
  label,
  value,
  onChange,
  type = 'text',
  suffix,
  placeholder,
  size = 'lg',
  error,
  inputMode,
  required,
  name
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'decimal';
  required?: boolean;
  name?: string;
}) {
  const [focus, setFocus] = useState(false);
  const filled = value !== undefined && value !== null && String(value).length > 0;
  const floating = focus || filled;

  const heights = { lg: 64, md: 56, sm: 48 } as const;
  const fontSizes = { lg: 28, md: 22, sm: 18 } as const;
  const labelTop = { lg: 22, md: 18, sm: 14 } as const;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label
        style={{
          position: 'absolute',
          left: 0,
          top: floating ? 0 : labelTop[size],
          fontSize: floating ? 11 : 13,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {label}
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          paddingTop: 24,
          paddingBottom: 12,
          borderBottom: `1px solid ${
            error ? 'var(--error)' : focus ? 'var(--text)' : 'var(--border-soft)'
          }`,
          minHeight: heights[size],
          transition: 'border-color 150ms ease'
        }}
      >
        <input
          name={name}
          type={type}
          value={value ?? ''}
          inputMode={inputMode}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={focus ? placeholder : ''}
          style={{
            flex: 1,
            border: 0,
            outline: 0,
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: fontSizes[size],
            fontWeight: 400,
            color: 'var(--text)',
            padding: 0,
            minWidth: 0
          }}
        />
        {suffix && (
          <span
            className="mono"
            style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--error)',
            marginTop: 8,
            letterSpacing: '0.02em'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
