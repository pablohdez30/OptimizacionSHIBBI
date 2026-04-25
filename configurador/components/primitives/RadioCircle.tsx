export function RadioCircle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: `1px solid ${checked ? 'var(--text)' : 'var(--border)'}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 150ms ease'
      }}
    >
      {checked && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--text)'
          }}
        />
      )}
    </span>
  );
}
