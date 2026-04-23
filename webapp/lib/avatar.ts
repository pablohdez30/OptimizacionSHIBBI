// Paleta de 8 colores (basada en los tonos del Design System de Claude Design)
// Determinista: el mismo nombre siempre obtiene el mismo color.

const PALETTE = [
  { bg: "#9DA4AE", fg: "#080808" }, // acero
  { bg: "#D4A574", fg: "#080808" }, // madera
  { bg: "#7AB3D9", fg: "#080808" }, // cristal
  { bg: "#F39C8E", fg: "#080808" }, // coral
  { bg: "#A78BFA", fg: "#080808" }, // lavanda
  { bg: "#FAC51C", fg: "#080808" }, // dorado
  { bg: "#6FBF8E", fg: "#080808" }, // verde
  { bg: "#E0A6D6", fg: "#080808" }, // rosa
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorFromName(name: string) {
  if (!name) return PALETTE[0];
  return PALETTE[hashString(name) % PALETTE.length];
}

export function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
