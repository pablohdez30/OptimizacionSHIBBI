import type { ConfiguracionMueble, Estimacion, Desglose } from './types';

export function calcularEstimacion(config: ConfiguracionMueble): Estimacion {
  const desglose: Desglose[] = [];
  let subtotal = 0;

  if (config.material && config.medidas.largo > 0 && config.medidas.ancho > 0) {
    const m2 = (config.medidas.largo / 100) * (config.medidas.ancho / 100);
    const factorGrosor = factorPorGrosor(config.grosor);
    const importe = m2 * config.material.precio_m2 * factorGrosor;
    desglose.push({
      concepto: `${config.material.nombre}${config.grosor ? ` (${config.grosor} cm)` : ''}`,
      cantidad: `${m2.toFixed(2)} m²`,
      importe: round2(importe)
    });
    subtotal += importe;
  }

  for (const c of config.componentes) {
    const importe = c.precio_unidad * c.cantidad;
    desglose.push({
      concepto: c.nombre,
      cantidad: `${c.cantidad} ud × ${c.precio_unidad.toFixed(2)} €`,
      importe: round2(importe)
    });
    subtotal += importe;
  }

  if (config.acabado && config.acabado.precio > 0) {
    desglose.push({
      concepto: `Acabado: ${config.acabado.nombre}`,
      cantidad: '',
      importe: round2(config.acabado.precio)
    });
    subtotal += config.acabado.precio;
  }

  const fijos = config.servicios.filter(s => s.modificador === 'fijo');
  const porcentajes = config.servicios.filter(s => s.modificador === 'porcentaje');

  for (const s of fijos) {
    desglose.push({ concepto: s.nombre, cantidad: '', importe: round2(s.precio) });
    subtotal += s.precio;
  }

  let total = subtotal;
  for (const s of porcentajes) {
    const incremento = subtotal * (s.precio / 100);
    desglose.push({
      concepto: s.nombre,
      cantidad: `+${s.precio} %`,
      importe: round2(incremento)
    });
    total += incremento;
  }

  return { total: round2(total), desglose };
}

function factorPorGrosor(cm?: number): number {
  if (!cm) return 1;
  if (cm <= 3) return 1;
  if (cm <= 5) return 1.25;
  return 1.6;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
