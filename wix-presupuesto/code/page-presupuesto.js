// Código de la página `/presupuesto` — wizard multi-paso para configurar
// un mueble Shibbi a medida y enviar la solicitud al equipo.
//
// Este archivo va en el panel de código de la página (Velo → Page Code).
// Pega TODO el contenido. No lleva nada más.

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { calcularEstimacion, resumenLegible } from 'public/pricing.js';
import { enviarSolicitud } from 'backend/quotes.web';

// ---------- ESTADO LOCAL ----------

const ESTADO_INICIAL = {
    tipo: null,
    material: null,
    grosor: null,
    medidas: { largo: 0, ancho: 0, alto: 0 },
    componentes: [],
    acabado: null,
    servicios: [],
    descripcionLibre: '',
    imagenes: [],
    nombre: '',
    email: '',
    telefono: '',
    canalPreferido: 'email',
    notasAdicionales: '',
    aceptaPrivacidad: false,
    presupuestoEstimado: 0,
    desglose: []
};

let config = clonarEstado(ESTADO_INICIAL);
let pasoActual = 1;
const PASOS_TOTALES = 5;

// Caché de las colecciones para no consultar Wix Data en cada cambio
const cache = {
    materiales: [],
    componentes: [],
    acabados: [],
    servicios: []
};

// ---------- ARRANQUE ----------

$w.onReady(async () => {
    mostrarPaso(1);
    bindBotonesNavegacion();
    bindCategoriaCards();
    bindInputsMedidas();
    bindFormularioFinal();

    await Promise.all([
        cargarMateriales(),
        cargarComponentes(),
        cargarExtras()
    ]);

    actualizarPanelPrecio();
});

// ---------- CARGA DE COLECCIONES ----------

async function cargarMateriales() {
    const res = await wixData.query('Materiales')
        .eq('activo', true)
        .ascending('orden')
        .find();
    cache.materiales = res.items;
}

async function cargarComponentes() {
    const res = await wixData.query('Componentes')
        .eq('activo', true)
        .ascending('orden')
        .find();
    cache.componentes = res.items;
}

async function cargarExtras() {
    const res = await wixData.query('Extras')
        .eq('activo', true)
        .ascending('orden')
        .find();
    cache.acabados = res.items.filter(e => e.categoria === 'acabado');
    cache.servicios = res.items.filter(e => e.categoria === 'servicio');
}

// ---------- NAVEGACIÓN ENTRE PASOS ----------

function bindBotonesNavegacion() {
    $w('#btnSiguiente1').onClick(() => irA(2));
    $w('#btnSiguiente2').onClick(() => irA(3));
    $w('#btnSiguiente3').onClick(() => irA(4));
    $w('#btnSiguiente4').onClick(() => irA(5));

    $w('#btnAtras2').onClick(() => irA(1));
    $w('#btnAtras3').onClick(() => irA(2));
    $w('#btnAtras4').onClick(() => irA(3));
    $w('#btnAtras5').onClick(() => irA(4));

    $w('#btnEnviar').onClick(() => onEnviar());
    $w('#btnVolverInicio').onClick(() => wixLocation.to('/'));
}

function irA(paso) {
    if (paso > pasoActual && !validarPaso(pasoActual)) return;
    mostrarPaso(paso);
}

function mostrarPaso(paso) {
    pasoActual = paso;
    $w('#wizard').changeState(`paso${paso}`);
    actualizarBarraProgreso();
    if (paso === 2) renderPaso2();
    if (paso === 3) renderPaso3();
    if (paso === 4) renderPaso4();
    if (paso === 5) renderPaso5();
}

function actualizarBarraProgreso() {
    const porcentaje = Math.round((pasoActual / PASOS_TOTALES) * 100);
    $w('#progressBar').value = porcentaje;
    $w('#txtPasoActual').text = `Paso ${pasoActual} de ${PASOS_TOTALES}`;
}

// ---------- PASO 1: CATEGORÍA ----------

function bindCategoriaCards() {
    const tarjetas = [
        { id: '#cardMesa', tipo: 'mesa', titulo: 'Mesa a medida' },
        { id: '#cardEstanteria', tipo: 'estanteria', titulo: 'Estantería a medida' },
        { id: '#cardEspejo', tipo: 'espejo', titulo: 'Espejo a medida' },
        { id: '#cardOtro', tipo: 'otro', titulo: 'Otro mueble (cuéntanoslo)' }
    ];

    tarjetas.forEach(t => {
        $w(t.id).onClick(() => {
            config.tipo = t.tipo;
            tarjetas.forEach(t2 => $w(t2.id).style.borderColor = '#E8E4DD');
            $w(t.id).style.borderColor = '#1A1A1A';
            $w('#txtCategoriaSeleccionada').text = t.titulo;
            $w('#btnSiguiente1').enable();
        });
    });

    $w('#btnSiguiente1').disable();
}

// ---------- PASO 2: CONFIGURACIÓN ----------

function renderPaso2() {
    if (config.tipo === 'otro') {
        $w('#contFormLibre').show();
        $w('#repeaterMateriales').hide();
        $w('#repeaterComponentes').hide();
        $w('#rbGrosor').hide();
        return;
    }

    $w('#contFormLibre').hide();
    $w('#repeaterMateriales').show();
    $w('#repeaterComponentes').show();

    // Repeater materiales
    const materialesAplicables = cache.materiales.filter(
        m => (m.aplicableA || []).includes(config.tipo)
    );
    $w('#repeaterMateriales').data = materialesAplicables;
    $w('#repeaterMateriales').onItemReady(($item, item) => {
        if (item.foto) $item('#imgMaterial').src = item.foto;
        $item('#txtNombreMaterial').text = item.nombre;
        $item('#txtPrecioMaterial').text = `${item.precioM2}€/m²`;
        $item('#tarjetaMaterial').onClick(() => {
            config.material = item;
            // Ofrecer las opciones de grosor del material
            const grosores = (item.grosorOpciones || '').split(',').map(g => g.trim()).filter(Boolean);
            if (grosores.length) {
                $w('#rbGrosor').show();
                $w('#rbGrosor').options = grosores.map(g => ({
                    label: g.includes('cm') || g.includes('mm') ? g : `${g} cm`,
                    value: g
                }));
                if (!config.grosor && grosores[0]) config.grosor = parseInt(grosores[0]);
            }
            actualizarPanelPrecio();
        });
    });

    // Grosor
    $w('#rbGrosor').onChange((e) => {
        const valor = parseInt(e.target.value);
        if (!isNaN(valor)) {
            config.grosor = valor;
            actualizarPanelPrecio();
        }
    });

    // Repeater componentes
    const componentesAplicables = cache.componentes.filter(
        c => (c.aplicableA || []).includes(config.tipo)
    );
    $w('#repeaterComponentes').data = componentesAplicables;
    $w('#repeaterComponentes').onItemReady(($item, item) => {
        if (item.foto) $item('#imgComponente').src = item.foto;
        $item('#txtNombreComponente').text = item.nombre;
        $item('#txtPrecioComponente').text = `${item.precioUnidad}€/ud`;

        $item('#tarjetaComponente').onClick(() => {
            // Toggle: si ya está, lo quito; si no, añado (de momento permitimos solo 1)
            const yaSeleccionado = config.componentes.some(c => c._id === item._id);
            if (yaSeleccionado) {
                config.componentes = config.componentes.filter(c => c._id !== item._id);
            } else {
                config.componentes = [{ ...item, cantidad: item.unidadDefault || 1 }];
            }
            actualizarPanelPrecio();
        });

        // Cantidad por componente
        const opciones = (item.unidadOpciones || `${item.unidadDefault}`)
            .split(',').map(u => u.trim()).filter(Boolean);
        $item('#rbCantidadComponente').options = opciones.map(u => ({ label: `${u} ud`, value: u }));
        $item('#rbCantidadComponente').value = String(item.unidadDefault);
        $item('#rbCantidadComponente').onChange((e) => {
            const idx = config.componentes.findIndex(c => c._id === item._id);
            if (idx >= 0) {
                config.componentes[idx].cantidad = parseInt(e.target.value);
                actualizarPanelPrecio();
            }
        });
    });

    // Form libre
    $w('#taDescripcionLibre').onChange((e) => {
        config.descripcionLibre = e.target.value;
    });
}

// ---------- PASO 3: MEDIDAS ----------

function bindInputsMedidas() {
    ['#inpLargo', '#inpAncho', '#inpAlto'].forEach(id => {
        $w(id).onChange(() => {
            config.medidas = {
                largo: numero($w('#inpLargo').value),
                ancho: numero($w('#inpAncho').value),
                alto: numero($w('#inpAlto').value)
            };
            const m2 = (config.medidas.largo / 100) * (config.medidas.ancho / 100);
            $w('#txtMetrosCuadrados').text = m2 > 0 ? `= ${m2.toFixed(2)} m²` : '';
            actualizarPanelPrecio();
        });
    });
}

function renderPaso3() {
    // El input de alto solo tiene sentido para estantería y espejo
    if (config.tipo === 'estanteria' || config.tipo === 'espejo') {
        $w('#inpAlto').show();
    } else {
        $w('#inpAlto').hide();
    }
}

// ---------- PASO 4: ACABADO + SERVICIOS ----------

function renderPaso4() {
    const acabadosAplicables = cache.acabados.filter(
        a => (a.aplicableA || []).includes(config.tipo)
    );
    $w('#repeaterAcabados').data = acabadosAplicables;
    $w('#repeaterAcabados').onItemReady(($item, item) => {
        $item('#txtNombreAcabado').text = item.nombre;
        $item('#txtPrecioAcabado').text = item.precio > 0 ? `+${item.precio}€` : 'Sin coste';
        $item('#tarjetaAcabado').onClick(() => {
            config.acabado = item;
            actualizarPanelPrecio();
        });
    });

    const serviciosAplicables = cache.servicios.filter(
        s => (s.aplicableA || []).includes(config.tipo)
    );
    $w('#repeaterServicios').data = serviciosAplicables;
    $w('#repeaterServicios').onItemReady(($item, item) => {
        $item('#txtNombreServicio').text = item.nombre;
        $item('#txtPrecioServicio').text = item.modificador === 'porcentaje'
            ? `+${item.precio}%`
            : `+${item.precio}€`;

        const yaSeleccionado = config.servicios.some(s => s._id === item._id);
        $item('#chkServicio').checked = yaSeleccionado;
        $item('#chkServicio').onChange((e) => {
            if (e.target.checked) {
                config.servicios.push(item);
            } else {
                config.servicios = config.servicios.filter(s => s._id !== item._id);
            }
            actualizarPanelPrecio();
        });
    });
}

// ---------- PASO 5: DATOS DEL CLIENTE ----------

function bindFormularioFinal() {
    $w('#inpNombre').onInput((e) => { config.nombre = e.target.value; });
    $w('#inpEmail').onInput((e) => { config.email = e.target.value; });
    $w('#inpTelefono').onInput((e) => { config.telefono = e.target.value; });
    $w('#rbCanal').onChange((e) => { config.canalPreferido = e.target.value; });
    $w('#taNotas').onChange((e) => { config.notasAdicionales = e.target.value; });
    $w('#chkPrivacidad').onChange((e) => { config.aceptaPrivacidad = e.target.checked; });
    $w('#txtErrorEnvio').hide();
    $w('#loaderEnvio').hide();

    $w('#uploadImagenes').onChange(() => {
        // El upload se procesa al enviar
    });
}

function renderPaso5() {
    const { total, desglose } = calcularEstimacion(config);
    config.presupuestoEstimado = total;
    config.desglose = desglose;

    $w('#repeaterDesgloseFinal').data = desglose.map((d, i) => ({ ...d, _id: `d${i}` }));
    $w('#repeaterDesgloseFinal').onItemReady(($item, item) => {
        $item('#txtConcepto').text = item.concepto;
        $item('#txtCantidad').text = item.cantidad || '';
        $item('#txtImporte').text = `${item.importe.toFixed(2)} €`;
    });

    $w('#txtTotalFinal').text = `${total.toFixed(2)} €`;
}

// ---------- ENVÍO ----------

async function onEnviar() {
    if (!validarPaso(5)) return;

    $w('#btnEnviar').disable();
    $w('#loaderEnvio').show();
    $w('#txtErrorEnvio').hide();

    try {
        // Subir imágenes si las hay
        let urlsImagenes = [];
        const upload = $w('#uploadImagenes');
        if (upload && upload.value && upload.value.length > 0) {
            const result = await upload.uploadFiles();
            urlsImagenes = result.map(f => f.fileUrl);
        }

        const payload = {
            ...config,
            imagenes: urlsImagenes
        };

        const res = await enviarSolicitud(payload);

        if (res.ok) {
            $w('#txtConfirmacionNombre').text = config.nombre;
            mostrarPaso('confirmacion');
            $w('#wizard').changeState('confirmacion');
        } else {
            mostrarError(res.error || 'No hemos podido enviar tu solicitud. Inténtalo de nuevo.');
        }
    } catch (err) {
        console.error('[onEnviar]', err);
        mostrarError('Error inesperado. Si persiste, escríbenos a shibbishop@gmail.com');
    } finally {
        $w('#loaderEnvio').hide();
        $w('#btnEnviar').enable();
    }
}

function mostrarError(mensaje) {
    $w('#txtErrorEnvio').text = mensaje;
    $w('#txtErrorEnvio').show();
}

// ---------- PANEL DE PRECIO EN VIVO ----------

function actualizarPanelPrecio() {
    const { total, desglose } = calcularEstimacion(config);
    config.presupuestoEstimado = total;
    config.desglose = desglose;

    $w('#txtTotalPrecio').text = total > 0 ? `${total.toFixed(2)} €` : '—';

    if (desglose.length === 0) {
        $w('#repeaterDesglose').data = [];
        return;
    }

    $w('#repeaterDesglose').data = desglose.map((d, i) => ({ ...d, _id: `live${i}` }));
    $w('#repeaterDesglose').onItemReady(($item, item) => {
        $item('#txtConcepto').text = item.concepto;
        $item('#txtCantidad').text = item.cantidad || '';
        $item('#txtImporte').text = `${item.importe.toFixed(2)} €`;
    });
}

// ---------- VALIDACIÓN ----------

function validarPaso(paso) {
    switch (paso) {
        case 1:
            return !!config.tipo;
        case 2:
            if (config.tipo === 'otro') {
                return config.descripcionLibre.trim().length >= 10;
            }
            return !!config.material;
        case 3:
            return config.medidas.largo > 0 && config.medidas.ancho > 0;
        case 4:
            return true; // acabado y extras son opcionales
        case 5:
            if (!config.nombre || config.nombre.trim().length < 2) {
                mostrarError('Falta tu nombre');
                return false;
            }
            if (!config.email || !config.email.includes('@')) {
                mostrarError('Email inválido');
                return false;
            }
            if (!config.aceptaPrivacidad) {
                mostrarError('Debes aceptar la política de privacidad');
                return false;
            }
            return true;
    }
    return true;
}

// ---------- UTILIDADES ----------

function numero(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function clonarEstado(s) {
    return JSON.parse(JSON.stringify(s));
}
