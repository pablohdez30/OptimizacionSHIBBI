// Backend Velo: maneja el envío de solicitudes de presupuesto.
// Este archivo va en `backend/quotes.web.js` dentro del proyecto Velo.
//
// Expone una sola función `enviarSolicitud` que:
//   1. Crea o actualiza el contacto en Wix CRM
//   2. Inserta la solicitud en la colección SolicitudesPresupuesto
//   3. Dispara los emails (interno al equipo + confirmación al cliente)
//
// El frontend la llama así:
//   import { enviarSolicitud } from 'backend/quotes.web';
//   const res = await enviarSolicitud(payload);

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { contacts, triggeredEmails } from 'wix-crm-backend';

const COLECCION = 'SolicitudesPresupuesto';

// IDs de las plantillas de email creadas en Wix Dashboard.
// Si las renombras allí, actualízalas aquí también.
const EMAIL_INTERNO = 'NuevaSolicitudPresupuesto';
const EMAIL_CONFIRMACION = 'ConfirmacionSolicitudCliente';

export const enviarSolicitud = webMethod(
    Permissions.Anyone,
    async (payload) => {
        try {
            validarPayload(payload);

            // 1. Contacto en Wix CRM
            const contactId = await crearOActualizarContacto(payload);

            // 2. Insertar solicitud (con permisos elevados — la colección es admin-only en read)
            const item = await wixData.insert(COLECCION, {
                tipo: payload.tipo,
                materialId: payload.material ? payload.material._id : null,
                materialNombre: payload.material ? payload.material.nombre : null,
                grosor: payload.grosor || null,
                medidasLargo: payload.medidas ? payload.medidas.largo : null,
                medidasAncho: payload.medidas ? payload.medidas.ancho : null,
                medidasAlto: payload.medidas ? payload.medidas.alto : null,
                componentes: payload.componentes || [],
                acabadoId: payload.acabado ? payload.acabado._id : null,
                extrasIds: (payload.servicios || []).map(s => s._id),
                descripcionLibre: payload.descripcionLibre || '',
                imagenes: payload.imagenes || [],
                presupuestoEstimado: payload.presupuestoEstimado || 0,
                desglose: payload.desglose || [],
                nombre: payload.nombre,
                email: payload.email,
                telefono: payload.telefono || '',
                canalPreferido: payload.canalPreferido || 'email',
                estado: 'pendiente',
                contactId: contactId || null,
                notasInternas: ''
            }, { suppressAuth: true });

            // 3. Emails (no bloqueantes — si fallan, la solicitud se ha guardado igual)
            mandarEmailsSeguro(contactId, payload, item._id);

            return { ok: true, id: item._id };

        } catch (err) {
            console.error('[enviarSolicitud] error', err);
            return {
                ok: false,
                error: err.message || 'Error al procesar la solicitud'
            };
        }
    }
);

function validarPayload(payload) {
    if (!payload) throw new Error('Datos vacíos');
    if (!payload.nombre || payload.nombre.trim().length < 2) throw new Error('Falta el nombre');
    if (!payload.email || !payload.email.includes('@')) throw new Error('Email inválido');
    if (!payload.tipo) throw new Error('Falta el tipo de mueble');
}

async function crearOActualizarContacto(payload) {
    try {
        const contactInfo = {
            name: { first: payload.nombre },
            emails: [{ email: payload.email, primary: true }]
        };
        if (payload.telefono) {
            contactInfo.phones = [{ phone: payload.telefono, primary: true }];
        }
        const result = await contacts.appendOrCreateContact(contactInfo);
        return result.contactId;
    } catch (err) {
        // No es crítico — si falla CRM, seguimos guardando la solicitud
        console.warn('[CRM] no se pudo crear/actualizar contacto', err);
        return null;
    }
}

function mandarEmailsSeguro(contactId, payload, solicitudId) {
    if (!contactId) return;

    const variables = {
        nombre: payload.nombre,
        tipo: payload.tipo,
        total: payload.presupuestoEstimado ? `${payload.presupuestoEstimado.toFixed(2)}€` : '—',
        material: payload.material ? payload.material.nombre : '—',
        descripcion: payload.descripcionLibre || '—',
        solicitudId
    };

    // Email a Shibbi (interno)
    triggeredEmails.emailContact(EMAIL_INTERNO, contactId, { variables })
        .catch(err => console.warn('[email interno]', err));

    // Email confirmación al cliente
    triggeredEmails.emailContact(EMAIL_CONFIRMACION, contactId, { variables })
        .catch(err => console.warn('[email cliente]', err));
}
