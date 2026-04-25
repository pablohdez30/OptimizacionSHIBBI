import { Resend } from 'resend';
import type { SolicitudInput } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || 'Shibbi <onboarding@resend.dev>';
const NOTIFICACION = process.env.SHIBBI_NOTIFICATION_EMAIL || 'shibbishop@gmail.com';

export async function enviarEmailInterno(solicitudId: string, payload: SolicitudInput) {
  const html = `
    <h2>Nueva solicitud de presupuesto</h2>
    <p><strong>Cliente:</strong> ${escapeHtml(payload.nombre)} &lt;${escapeHtml(payload.email)}&gt;</p>
    ${payload.telefono ? `<p><strong>Teléfono:</strong> ${escapeHtml(payload.telefono)}</p>` : ''}
    <p><strong>Canal preferido:</strong> ${payload.canal_preferido}</p>
    <hr/>
    <p><strong>Tipo:</strong> ${payload.tipo}</p>
    ${payload.material ? `<p><strong>Material:</strong> ${escapeHtml(payload.material.nombre)}${payload.grosor ? ` (${payload.grosor} cm)` : ''}</p>` : ''}
    <p><strong>Medidas:</strong> ${payload.medidas.largo} × ${payload.medidas.ancho}${payload.medidas.alto ? ` × ${payload.medidas.alto}` : ''} cm</p>
    <hr/>
    <h3>Estimación que vio el cliente: ${payload.presupuesto_estimado.toFixed(2)} €</h3>
    <table cellpadding="6" style="border-collapse: collapse; width: 100%; font-family: monospace;">
      ${payload.desglose.map(d => `
        <tr>
          <td>${escapeHtml(d.concepto)}</td>
          <td>${escapeHtml(d.cantidad)}</td>
          <td style="text-align: right;">${d.importe.toFixed(2)} €</td>
        </tr>
      `).join('')}
    </table>
    ${payload.descripcion_libre ? `<hr/><p><strong>Descripción:</strong></p><p>${escapeHtml(payload.descripcion_libre).replace(/\n/g, '<br/>')}</p>` : ''}
    ${payload.notas_adicionales ? `<p><strong>Notas:</strong> ${escapeHtml(payload.notas_adicionales)}</p>` : ''}
    ${payload.imagenes.length ? `<p><strong>Imágenes adjuntas:</strong> ${payload.imagenes.length}</p>` : ''}
    <hr/>
    <p style="font-size: 12px; color: #6e6e73;">ID interno: ${solicitudId}</p>
  `;

  return resend.emails.send({
    from: FROM,
    to: NOTIFICACION,
    replyTo: payload.email,
    subject: `Nueva solicitud — ${payload.nombre} (${payload.tipo})`,
    html
  });
}

export async function enviarEmailConfirmacion(payload: SolicitudInput) {
  const html = `
    <p>Hola ${escapeHtml(payload.nombre)},</p>
    <p>Hemos recibido tu solicitud de ${payload.tipo} a medida.</p>
    <p>Te respondemos en menos de 24 horas con un presupuesto detallado.</p>
    <p>Si quieres añadir algo o tienes prisa, responde a este email o escríbenos por Instagram (@shibbishop).</p>
    <p>Un abrazo,<br/>El equipo de Shibbi</p>
  `;

  return resend.emails.send({
    from: FROM,
    to: payload.email,
    subject: 'Hemos recibido tu solicitud',
    html
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
