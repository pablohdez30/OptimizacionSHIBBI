import type {
  Configuracion,
  Estimacion,
  DesgloseItem,
  Material,
  Componente,
  Acabado,
  Servicio
} from './types';
import { MATERIALES, COMPONENTES, ACABADOS, SERVICIOS } from './catalogo';

export function calcularEstimacion(config: Configuracion): Estimacion {
  const desglose: DesgloseItem[] = [];
  let total = 0;

  // Material principal
  if (config.material_id) {
    const mat = MATERIALES.find((m: Material) => m.id === config.material_id);
    if (mat) {
      const largoCm = typeof config.medidas.largo === 'number' ? config.medidas.largo : 0;
      const anchoCm = typeof config.medidas.ancho === 'number' ? config.medidas.ancho : 0;
      const m2 = (largoCm / 100) * (anchoCm / 100);
      if (m2 > 0) {
        const importe = round2(m2 * mat.precio_m2);
        desglose.push({
          id: 'material',
          titulo: `${mat.nombre}${config.grosor ? ` (${config.grosor} cm)` : ''}`,
          subtitulo: `${m2.toFixed(2).replace('.', ',')} m²`,
          importe
        });
        total += importe;
      }
    }
  }

  // Componentes (patas, soportes…)
  for (const cmp of config.componentes) {
    const c = COMPONENTES.find((x: Componente) => x.id === cmp.id);
    if (!c) continue;
    const importe = round2(c.precio_unidad * cmp.cantidad);
    desglose.push({
      id: `comp-${c.id}`,
      titulo: c.nombre,
      subtitulo: `${cmp.cantidad} ud × ${c.precio_unidad} €`,
      importe
    });
    total += importe;
  }

  // Acabado
  if (config.acabado_id) {
    const a = ACABADOS.find((x: Acabado) => x.id === config.acabado_id);
    if (a) {
      desglose.push({
        id: `acab-${a.id}`,
        titulo: a.nombre,
        subtitulo: null,
        importe: a.precio
      });
      total += a.precio;
    }
  }

  // Servicios
  for (const sid of config.servicios_ids) {
    const s = SERVICIOS.find((x: Servicio) => x.id === sid);
    if (!s) continue;
    desglose.push({
      id: `serv-${s.id}`,
      titulo: s.nombre,
      subtitulo: null,
      importe: s.precio
    });
    total += s.precio;
  }

  return { total: Math.round(total), desglose };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
