type Props = {
  title: string;
  description?: string;
};

export default function PageStub({ title, description }: Props) {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-semibold tracking-tight mb-2">{title}</h1>
      {description && (
        <p className="text-text-muted max-w-2xl mb-10">{description}</p>
      )}
      <div className="bg-surface-1 border border-border rounded-xl p-10 text-center">
        <p className="text-text-muted">
          <span className="mono text-xs tracking-[0.2em] text-gold">
            EN CONSTRUCCIÓN
          </span>
        </p>
        <p className="text-text-muted mt-4 text-sm">
          Esta pantalla se implementará en la Fase C (convertir los diseños de
          Claude Design a páginas conectadas a Supabase).
        </p>
      </div>
    </div>
  );
}
