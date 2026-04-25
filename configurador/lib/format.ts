// Formato europeo: separador de miles "." y decimal ",".
export function formatEUR(n: number, opts: { decimals?: number } = {}): string {
  const decimals = opts.decimals ?? 2;
  return Number(n)
    .toFixed(decimals)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
