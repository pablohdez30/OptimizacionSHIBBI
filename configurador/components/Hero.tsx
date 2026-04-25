import { Container } from '@/components/primitives/Container';

export function Hero() {
  return (
    <section style={{ paddingTop: 120, paddingBottom: 96 }}>
      <Container>
        <h1
          className="display"
          style={{
            fontSize: 'clamp(56px, 8vw, 104px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            marginBottom: 40,
            textWrap: 'balance' as 'balance'
          }}
        >
          Diseña tu mueble.
          <br />
          A medida.
        </h1>
        <p style={{ fontSize: 20, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.45 }}>
          Elige el material, las medidas y el acabado.
          <br />
          Te damos una estimación al instante.
        </p>
      </Container>
    </section>
  );
}
