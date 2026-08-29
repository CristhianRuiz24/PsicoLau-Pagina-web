const { escapeHtml } = require('../utils/sanitizer');

// Remitente y Destinatario oficial
const REMITENTE = process.env.REMITENTE || 'PsicoLau <contacto@psicolau.com>';
const CORREO_DESTINO = process.env.CORREO_LAURA || 'lince_lg@yahoo.com.mx';

/**
 * Envío de correos mediante la API REST oficial de Resend (HTTPS / Puerto 443).
 * Evita bloqueos de puertos SMTP (465/587) en proveedores como Render y responde en <200ms.
 */
const enviarEmailResend = async ({ to, subject, html, replyTo }) => {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) {
    console.warn('[Resend API] RESEND_API_KEY no está configurada en las variables de entorno. Omitiendo envío de correo.');
    return { success: false, message: 'RESEND_API_KEY no configurada' };
  }

  const payload = {
    from: REMITENTE,
    to: Array.isArray(to) ? to : [to],
    subject,
    html
  };

  if (replyTo && String(replyTo).trim().length > 0) {
    payload.reply_to = String(replyTo).trim();
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend API Error]:', data);
      throw new Error(data.message || `Error en Resend API (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('[Resend Network Error]:', error.message);
    throw error;
  }
};

const enviarConfirmacionPaciente = async (emailPaciente, nombrePaciente, fechaHora) => {
  try {
    const sNombre = escapeHtml(nombrePaciente);
    const sFecha = escapeHtml(new Date(fechaHora).toLocaleString('es-MX'));

    return await enviarEmailResend({
      to: emailPaciente,
      subject: 'Solicitud de Cita Recibida - PsicoLau',
      html: `
        <h2>Hola ${sNombre},</h2>
        <p>Hemos recibido tu solicitud de cita para el <strong>${sFecha}</strong>.</p>
        <p>La Lic. Laura Gómez revisará la solicitud y te contactaremos a la brevedad para confirmar y enviarte los detalles de pago.</p>
        <p>Gracias por confiar en PsicoLau.</p>
      `
    });
  } catch (error) {
    console.warn('Aviso: No se pudo enviar confirmación al paciente:', error.message);
  }
};

const enviarAvisoLaura = async (citaDetalles) => {
  const { paciente, fechaHora, categoria } = citaDetalles;
  const sNombre = escapeHtml(paciente.nombre);
  const sEmail = escapeHtml(paciente.email);
  const sTelefono = escapeHtml(paciente.telefono);
  const sFecha = escapeHtml(new Date(fechaHora).toLocaleString('es-MX'));
  const sCategoria = escapeHtml(categoria || 'No especificada');

  const replyTo = paciente.email && !paciente.email.startsWith('sin-email-') ? paciente.email : undefined;

  return enviarEmailResend({
    to: CORREO_DESTINO,
    replyTo,
    subject: `Nueva solicitud de cita - ${sNombre}`,
    html: `
      <h2>Nueva solicitud de cita</h2>
      <ul>
        <li><strong>Paciente:</strong> ${sNombre}</li>
        <li><strong>Email:</strong> ${sEmail}</li>
        <li><strong>Teléfono:</strong> ${sTelefono}</li>
        <li><strong>Fecha y Hora solicitada:</strong> ${sFecha}</li>
        <li><strong>Categoría / Nota:</strong> ${sCategoria}</li>
      </ul>
      <p>Revisa el panel de administración para confirmarla.</p>
    `
  });
};

const enviarMensajeContacto = async (datos) => {
  const { nombre, email, telefono, categoria, mensaje } = datos;
  const sNombre = escapeHtml(nombre);
  const sEmail = escapeHtml(email);
  const sTelefono = escapeHtml(telefono);
  const sCategoria = escapeHtml(categoria || 'No especificado');
  const sMensaje = escapeHtml(mensaje);
  const telLimpio = telefono ? escapeHtml(telefono.replace(/\D/g, '')) : '';

  return enviarEmailResend({
    to: CORREO_DESTINO,
    replyTo: email,
    subject: `Nuevo mensaje de contacto en web - ${sNombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #EC5E86; border-bottom: 2px solid #3EB8CC; padding-bottom: 8px;">Nuevo mensaje de contacto desde la web</h2>
        <ul style="list-style: none; padding: 0; line-height: 1.8;">
          <li><strong>Nombre:</strong> ${sNombre}</li>
          <li><strong>Email:</strong> <a href="mailto:${sEmail}">${sEmail}</a></li>
          <li><strong>Teléfono / WhatsApp:</strong> ${sTelefono ? `<a href="https://wa.me/${telLimpio}">${sTelefono}</a>` : 'No proporcionado'}</li>
          <li><strong>Motivo de consulta:</strong> ${sCategoria}</li>
        </ul>
        <h3 style="color: #334155; margin-top: 15px;">Mensaje del paciente:</h3>
        <blockquote style="background: #f8fafc; padding: 12px 16px; border-left: 4px solid #EC5E86; margin: 0; font-size: 0.95rem; line-height: 1.5; color: #1e293b;">
          ${sMensaje}
        </blockquote>
        <p style="margin-top: 20px; font-size: 0.85rem; color: #64748b;">
          <em>Tip: Puedes responder directamente a este correo haciendo clic en "Responder" para escribirle a ${sEmail}.</em>
        </p>
      </div>
    `
  });
};

module.exports = {
  enviarConfirmacionPaciente,
  enviarAvisoLaura,
  enviarMensajeContacto
};
