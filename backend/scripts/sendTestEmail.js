/**
 * sendTestEmail.js
 * 
 * Script utilitario interactivo para disparar un correo de prueba real mediante Resend API
 * y verificar la entrega y el renderizado en la bandeja de entrada.
 * 
 * Uso:
 *   node backend/scripts/sendTestEmail.js [destinatario] [tipo: aviso | confirmacion | contacto]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Permitir envío real en entorno local explícitamente para este script
process.env.ENABLE_REAL_EMAILS_DEV = 'true';
process.env.NODE_ENV = 'development';

const emailService = require('../src/services/emailService');

async function main() {
  const args = process.argv.slice(2);
  const correoDestino = args[0] || process.env.CORREO_LAURA || 'contacto@psicolau.com';
  const tipo = (args[1] || 'aviso').toLowerCase();

  console.log('----------------------------------------------------');
  console.log('🚀 ENVIANDO CORREO DE PRUEBA REAL VÍA RESEND');
  console.log(`📬 Destinatario : ${correoDestino}`);
  console.log(`📋 Plantilla    : ${tipo.toUpperCase()}`);
  console.log('----------------------------------------------------');

  let resultado;

  if (tipo === 'confirmacion') {
    resultado = await emailService.enviarConfirmacionPaciente(
      correoDestino,
      'Paciente de Prueba',
      new Date()
    );
  } else if (tipo === 'contacto') {
    resultado = await emailService.enviarEmailResend({
      to: correoDestino,
      replyTo: 'paciente.prueba@gmail.com',
      subject: 'Prueba de Mensaje de Contacto - PsicoLau',
      html: emailService.construirPlantillaBase({
        titulo: 'Nuevo Mensaje de Contacto (Prueba)',
        subtitulo: 'Este es un correo de prueba para validar el diseño visual en tu bandeja.',
        badge: 'Prueba Real',
        contenidoHtml: `
          <div style="background-color: #F8FAFC; border-left: 4px solid #EC5E86; padding: 14px 18px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #1E293B;">
            Hola, este mensaje certifica que las plantillas de correo institucional de PsicoLau se renderizan correctamente con la cabecera corporativa, tarjetas y botón de acción.
          </div>
        `,
        botonAccion: {
          texto: 'Abrir Panel Clínico →',
          url: 'https://psicolau.com/panel',
          color: '#1E94A8'
        },
        textoFooter: 'Mensaje de prueba de conectividad y diseño de correo transaccional.'
      })
    });
  } else {
    // Por defecto: Aviso a Laura usando directamente la función oficial enviarAvisoLaura
    resultado = await emailService.enviarAvisoLaura({
      paciente: {
        nombre: 'Dra. María Elena Ramos Sánchez',
        email: 'maria.ramos@gmail.com',
        telefono: '+52 55 4321 8765'
      },
      categoria: 'Terapia Individual',
      destinoOverride: correoDestino
    });
  }

  console.log('✅ RESPUESTA DE RESEND:');
  console.log(resultado);
  console.log('----------------------------------------------------');
  if (resultado && resultado.id) {
    console.log(`🎉 Correo entregado a Resend con ID: ${resultado.id}`);
    console.log('Revisa la bandeja de entrada o la pestaña "Emails" en tu panel de Resend.');
  }
}

main().catch(err => {
  console.error('❌ Error al enviar correo de prueba:', err.message);
  process.exit(1);
});
