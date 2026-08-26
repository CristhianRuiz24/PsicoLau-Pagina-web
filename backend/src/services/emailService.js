const nodemailer = require('nodemailer');
const { escapeHtml } = require('../utils/sanitizer');

// Configuración para usar Resend (o cualquier otro SMTP compatible)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  secure: true,
  port: 465,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

// Remitente y Destinatario
const REMITENTE = process.env.REMITENTE || 'PsicoLau Web <contacto@psicolau.com>';
const CORREO_DESTINO = process.env.CORREO_LAURA || 'lince_lg@yahoo.com.mx';

const enviarConfirmacionPaciente = async (emailPaciente, nombrePaciente, fechaHora) => {
  try {
    const sNombre = escapeHtml(nombrePaciente);
    const sFecha = escapeHtml(new Date(fechaHora).toLocaleString('es-MX'));

    const mailOptions = {
      from: REMITENTE,
      to: emailPaciente,
      subject: 'Solicitud de Cita Recibida - PsicoLau',
      html: `
        <h2>Hola ${sNombre},</h2>
        <p>Hemos recibido tu solicitud de cita para el <strong>${sFecha}</strong>.</p>
        <p>La Lic. Laura Gómez revisará la solicitud y te contactaremos a la brevedad para confirmar y enviarte los detalles de pago.</p>
        <p>Gracias por confiar en PsicoLau.</p>
      `
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    // Si Resend bloquea por sandbox de dominio no verificado, loguear para no romper el flujo
    console.warn('Aviso: No se pudo enviar confirmación al paciente debido a restricciones de sandbox en Resend:', error.message);
  }
};

const enviarAvisoLaura = async (citaDetalles) => {
  const { paciente, fechaHora, categoria } = citaDetalles;
  const sNombre = escapeHtml(paciente.nombre);
  const sEmail = escapeHtml(paciente.email);
  const sTelefono = escapeHtml(paciente.telefono);
  const sFecha = escapeHtml(new Date(fechaHora).toLocaleString('es-MX'));
  const sCategoria = escapeHtml(categoria || 'No especificada');

  const mailOptions = {
    from: REMITENTE,
    to: CORREO_DESTINO,
    replyTo: paciente.email && !paciente.email.startsWith('sin-email-') ? paciente.email : undefined,
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
  };
  return transporter.sendMail(mailOptions);
};

const enviarMensajeContacto = async (datos) => {
  const { nombre, email, telefono, categoria, mensaje } = datos;
  const sNombre = escapeHtml(nombre);
  const sEmail = escapeHtml(email);
  const sTelefono = escapeHtml(telefono);
  const sCategoria = escapeHtml(categoria || 'No especificado');
  const sMensaje = escapeHtml(mensaje);
  const telLimpio = telefono ? escapeHtml(telefono.replace(/\D/g, '')) : '';

  const mailOptions = {
    from: REMITENTE,
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
  };
  return transporter.sendMail(mailOptions);
};

module.exports = {
  enviarConfirmacionPaciente,
  enviarAvisoLaura,
  enviarMensajeContacto
};
