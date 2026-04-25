// Módulo de cálculo de precios — compartido entre frontend y backend.
// En Velo, los archivos de `public/` se importan así:
//   import { calcularEstimacion } from 'public/pricing.js';

/**
 * Calcula la estimación orientativa a partir de la configuración del cliente.
 *
 * @param {Object} config
 * @param {string} config.tipo            'mesa' | 'estanteria' | 'espejo' | 'otro'
 * @param {Object} [config.material]      Item de la colección Materiales
 * @param {number} [config.grosor]        Grosor en cm
 * @param {Object} [config.medidas]       { largo, ancho, alto } en cm
 * @param {Array}  [config.componentes]   [{ ...componente, cantidad: number }]
 * @param {Object} [config.acabado]       Item de la colección Extras (categoria='acabado')
 * @param {Array}  [config.servicios]     Items de Extras (categoria='servicio')
 * @returns {{ total: number, desglose: Array<{concepto, cantidad, importe}> }}
 */
export function calcularEstimacion(config) {
    const desglose = [];
    let subtotal = 0;

    // --- Tablón / superficie principal ---
    if (config.material && config.medidas && config.medidas.largo && config.medidas.ancho) {
        const m2 = (config.medidas.largo / 100) * (config.medidas.ancho / 100);
        const factorGrosor = factorPorGrosor(config.grosor);
        const importe = m2 * config.material.precioM2 * factorGrosor;
        desglose.push({
            concepto: `${config.material.nombre}${config.grosor ? ` (${config.grosor}cm)` : ''}`,
            cantidad: `${m2.toFixed(2)} m²`,
            importe: round2(importe)
        });
        subtotal += importe;
    }

    // --- Componentes (patas, soportes) ---
    if (Array.isArray(config.componentes)) {
        config.componentes.forEach(c => {
            const cantidad = c.cantidad || c.unidadDefault || 1;
            const importe = c.precioUnidad * cantidad;
            desglose.push({
                concepto: c.nombre,
                cantidad: `${cantidad} ud × ${c.precioUnidad.toFixed(2)}€`,
                importe: round2(importe)
            });
            subtotal += importe;
        });
    }

    // --- Acabado ---
    if (config.acabado && config.acabado.precio > 0) {
        desglose.push({
            concepto: `Acabado: ${config.acabado.nombre}`,
            cantidad: '',
            importe: round2(config.acabado.precio)
        });
        subtotal += config.acabado.precio;
    }

    // --- Servicios extra (separamos los de porcentaje porque van al final) ---
    const serviciosFijos = (config.servicios || []).filter(s => s.modificador === 'fijo');
    const serviciosPorcentaje = (config.servicios || []).filter(s => s.modificador === 'porcentaje');

    serviciosFijos.forEach(s => {
        desglose.push({
            concepto: s.nombre,
            cantidad: '',
            importe: round2(s.precio)
        });
        subtotal += s.precio;
    });

    // Aplicar recargos en porcentaje sobre el subtotal acumulado hasta aquí
    let total = subtotal;
    serviciosPorcentaje.forEach(s => {
        const incremento = subtotal * (s.precio / 100);
        desglose.push({
            concepto: s.nombre,
            cantidad: `+${s.precio}%`,
            importe: round2(incremento)
        });
        total += incremento;
    });

    return {
        total: round2(total),
        desglose
    };
}

/**
 * Factor multiplicador según grosor del tablón.
 * Sin grosor → factor neutro 1.
 */
function factorPorGrosor(cm) {
    if (!cm) return 1;
    if (cm <= 3) return 1;
    if (cm <= 5) return 1.25;
    return 1.6;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

/**
 * Devuelve el importe mínimo razonable a mostrar.
 * Útil para no enseñar 0€ cuando el cliente aún no ha elegido nada.
 */
export function precioMinimoVisual() {
    return 0;
}

/**
 * Genera un texto resumen legible de la configuración.
 * Útil para emails y para el resumen final.
 */
export function resumenLegible(config) {
    const lineas = [];
    lineas.push(`Tipo: ${capitalizar(config.tipo)}`);

    if (config.material) {
        lineas.push(`Material: ${config.material.nombre}${config.grosor ? ` (${config.grosor}cm)` : ''}`);
    }
    if (config.medidas && (config.medidas.largo || config.medidas.ancho)) {
        const partes = [];
        if (config.medidas.largo) partes.push(`${config.medidas.largo}cm largo`);
        if (config.medidas.ancho) partes.push(`${config.medidas.ancho}cm ancho`);
        if (config.medidas.alto) partes.push(`${config.medidas.alto}cm alto`);
        lineas.push(`Medidas: ${partes.join(' × ')}`);
    }
    if (Array.isArray(config.componentes) && config.componentes.length) {
        config.componentes.forEach(c => {
            lineas.push(`Componente: ${c.nombre} × ${c.cantidad || c.unidadDefault}`);
        });
    }
    if (config.acabado) {
        lineas.push(`Acabado: ${config.acabado.nombre}`);
    }
    if (Array.isArray(config.servicios) && config.servicios.length) {
        lineas.push(`Servicios: ${config.servicios.map(s => s.nombre).join(', ')}`);
    }
    if (config.descripcionLibre) {
        lineas.push(`Descripción libre: ${config.descripcionLibre}`);
    }

    return lineas.join('\n');
}

function capitalizar(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}
