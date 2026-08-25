const nodemailer = require('nodemailer');

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
// Nota: Resend en modo gratuito/sandbox (onboarding@resend.dev) sólo permite enviar al correo de la cuenta registrada.
const REMITENTE = process.env.REMITENTE || 'PsicoLau Web <onboarding@resend.dev>';
const CORREO_DESTINO = process.env.CORREO_LAURA || process.env.EMAIL_DESTINO || 'crisr686868@gmail.com';

const enviarConfirmacionPaciente = async (emailPaciente, nombrePaciente, fechaHora) => {
  try {
    const mailOptions = {
      from: REMITENTE,
      to: emailPaciente,
      subject: 'Solicitud de Cita Recibida - PsicoLau',
      html: `
        <h2>Hola ${nombrePaciente},</h2>
        <p>Hemos recibido tu solicitud de cita para el <strong>${new Date(fechaHora).toLocaleString('es-MX')}</strong>.</p>
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
  const mailOptions = {
    from: REMITENTE,
    to: CORREO_DESTINO,
    replyTo: paciente.email && !paciente.email.startsWith('sin-email-') ? paciente.email : undefined,
    subject: `Nueva solicitud de cita - ${paciente.nombre}`,
    html: `
      <h2>Nueva solicitud de cita</h2>
      <ul>
        <li><strong>Paciente:</strong> ${paciente.nombre}</li>
        <li><strong>Email:</strong> ${paciente.email}</li>
        <li><strong>Teléfono:</strong> ${paciente.telefono}</li>
        <li><strong>Fecha y Hora solicitada:</strong> ${new Date(fechaHora).toLocaleString('es-MX')}</li>
        <li><strong>Categoría / Nota:</strong> ${categoria || 'No especificada'}</li>
      </ul>
      <p>Revisa el panel de administración para confirmarla.</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

const enviarMensajeContacto = async (datos) => {
  const { nombre, email, telefono, categoria, mensaje } = datos;
  const mailOptions = {
    from: REMITENTE,
    to: CORREO_DESTINO,
    replyTo: email,
    subject: `Nuevo mensaje de contacto en web - ${nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #EC5E86; border-bottom: 2px solid #3EB8CC; padding-bottom: 8px;">Nuevo mensaje de contacto desde la web</h2>
        <ul style="list-style: none; padding: 0; line-height: 1.8;">
          <li><strong>Nombre:</strong> ${nombre}</li>
          <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
          <li><strong>Teléfono / WhatsApp:</strong> ${telefono ? `<a href="https://wa.me/${telefono.replace(/\D/g, '')}">${telefono}</a>` : 'No proporcionado'}</li>
          <li><strong>Motivo de consulta:</strong> ${categoria || 'No especificado'}</li>
        </ul>
        <h3 style="color: #334155; margin-top: 15px;">Mensaje del paciente:</h3>
        <blockquote style="background: #f8fafc; padding: 12px 16px; border-left: 4px solid #EC5E86; margin: 0; font-size: 0.95rem; line-height: 1.5; color: #1e293b;">
          ${mensaje}
        </blockquote>
        <p style="margin-top: 20px; font-size: 0.85rem; color: #64748b;">
          <em>Tip: Puedes responder directamente a este correo haciendo clic en "Responder" para escribirle a ${email}.</em>
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
