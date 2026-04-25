import type { CSSProperties, ReactNode } from 'react';

export function Container({
  children,
  style
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--side-pad)',
        width: '100%',
        ...style
      }}
    >
      {children}
    </div>
  );
}
