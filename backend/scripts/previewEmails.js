/**
 * previewEmails.js
 * Genera archivos HTML de vista previa de las plantillas de correo para inspección visual.
 */

const fs = require('fs');
const path = require('path');

// Interceptar temporalmente enviarEmailResend capturando el HTML generado
process.env.NODE_ENV = 'test';
const emailService = require('../src/services/emailService');

async function generarVistasPrevias() {
  const outputDir = path.join(__dirname, '../../scratch/email-previews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Aviso de cita a Laura
  const avisoLaura = await emailService.enviarAvisoLaura({
    paciente: {
      nombre: 'Dra. María Elena Ramos Sánchez',
      email: 'maria.ramos@gmail.com',
      telefono: '+52 55 4321 8765'
    },
    fechaHora: new Date('2026-09-18T16:00:00.000Z'),
    categoria: 'Terapia Individual'
  });
  fs.writeFileSync(path.join(outputDir, '1-aviso-laura.html'), avisoLaura.html, 'utf8');

  // 2. Confirmación al paciente
  const confirmacion = await emailService.enviarConfirmacionPaciente(
    'maria.ramos@gmail.com',
    'Dra. María Elena Ramos Sánchez',
    new Date('2026-09-18T16:00:00.000Z')
  );
  fs.writeFileSync(path.join(outputDir, '2-confirmacion-paciente.html'), confirmacion.html, 'utf8');

  // 3. Mensaje de contacto
  const contacto = await emailService.enviarMensajeContacto({
    nombre: 'Carlos Mendoza Villarreal',
    email: 'carlos.mendoza@yahoo.com.mx',
    telefono: '+52 55 9876 5432',
    categoria: 'Orientación Psicológica y Resiliencia',
    mensaje: 'Hola Lic. Laura, me gustaría solicitar informes sobre las sesiones de terapia individual en línea y la disponibilidad para las tardes entre semana. Agradezco mucho de antemano su atención.'
  });
  fs.writeFileSync(path.join(outputDir, '3-mensaje-contacto.html'), contacto.html, 'utf8');

  console.log(`[Vistas Previas Generadas Exitosamente en]: ${outputDir}`);
}

if (require.main === module) {
  generarVistasPrevias().catch(console.error);
}

module.exports = { generarVistasPrevias };
