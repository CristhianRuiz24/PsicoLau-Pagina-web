/**
 * testWhatsAppEvaluaciones.js
 * 
 * Verifica que los mensajes de WhatsApp diferencien correctamente entre:
 * 1. Cita individual ("sesión de terapia")
 * 2. Evaluación ("sesión de evaluación" y Zoom de evaluación)
 * 3. Terapia grupal
 * Y que la validación de teléfono exija al menos 10 dígitos.
 */

const assert = require('assert');

function generarMensajeRecordatorio({ nombrePaciente, esEvaluacion, esGrupal, diaTexto, diaNum, mesTexto, horaLimpia, enlaceZoom }) {
  if (esGrupal) {
    let bloqueZoomGrupal = enlaceZoom ? `\n\n*Enlace de Zoom para la sesión:*\n${enlaceZoom.trim()}` : '';
    return `Hola a todos, les saludo con gusto. Les comparto los detalles para nuestra sesión de *${nombrePaciente}* de este *${diaTexto} ${diaNum} de ${mesTexto} a las ${horaLimpia}*:${bloqueZoomGrupal}\n\n¡Nos vemos en la sesión grupal!\n\n- PsicoLau (Laura Gómez)`;
  }

  let bloqueZoom = '';
  if (enlaceZoom) {
    bloqueZoom = esEvaluacion 
      ? `\n\n*Enlace para conectarte a tu evaluación (Zoom):*\n${enlaceZoom.trim()}`
      : `\n\n*Enlace para conectarte (Zoom):*\n${enlaceZoom.trim()}`;
  }

  const tipoTexto = esEvaluacion ? 'evaluación' : 'terapia';
  return `Hola ${nombrePaciente}, te recuerdo con gusto nuestra sesión de ${tipoTexto} agendada para este ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaLimpia}.${bloqueZoom}\n\nNos vemos pronto.\n\n- PsicoLau (Laura Gómez)`;
}

function generarMensajeCobro({ nombrePaciente, esEvaluacion, esGrupal, diaTexto, diaNum, mesTexto, horaLimpia, bloqueDatos }) {
  const tipoTexto = esEvaluacion ? 'evaluación' : (esGrupal ? 'terapia grupal' : 'terapia');
  return `Hola ${nombrePaciente}, te saludo con gusto. Te comparto este mensaje respecto a tu sesión de ${tipoTexto} del ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaLimpia}.\n\nPara confirmar y mantener al día tu registro de sesiones, te dejo los datos para tu aportación:${bloqueDatos}\n\nUna vez realizado, te agradecería mucho compartirme tu comprobante por este medio. Si ya lo enviaste, haz caso omiso a este mensaje. ¡Muchas gracias!\n\n- PsicoLau (Laura Gómez)`;
}

function validarYLimpiarTelefono(telRaw) {
  if (!telRaw) return null;
  let telLimpio = telRaw.replace(/\D/g, '');
  if (telLimpio.length === 10 && !telRaw.startsWith('+')) {
    telLimpio = '52' + telLimpio;
  }
  if (telLimpio.length < 10) {
    return null; // Teléfono inválido
  }
  return telLimpio;
}

// Tests
console.log('🧪 Ejecutando pruebas de generación de mensajes de WhatsApp...\n');

// 1. Evaluación: Recordatorio
const msgEval = generarMensajeRecordatorio({
  nombrePaciente: 'natalia',
  esEvaluacion: true,
  esGrupal: false,
  diaTexto: 'jueves',
  diaNum: 3,
  mesTexto: 'septiembre',
  horaLimpia: '07:00 a.m',
  enlaceZoom: 'https://zoom.us/j/123456'
});

assert.ok(msgEval.includes('nuestra sesión de evaluación agendada'), 'El mensaje de evaluación debe decir "nuestra sesión de evaluación"');
assert.ok(!msgEval.includes('nuestra sesión de terapia agendada'), 'El mensaje de evaluación NO debe decir "sesión de terapia"');
assert.ok(msgEval.includes('*Enlace para conectarte a tu evaluación (Zoom):*'), 'Debe indicar que el enlace es para la evaluación');
console.log('✅ Test 1: Recordatorio de WhatsApp para Evaluación validado con éxito.');

// 2. Individual: Recordatorio
const msgInd = generarMensajeRecordatorio({
  nombrePaciente: 'Carlos',
  esEvaluacion: false,
  esGrupal: false,
  diaTexto: 'viernes',
  diaNum: 4,
  mesTexto: 'septiembre',
  horaLimpia: '10:00 a.m',
  enlaceZoom: 'https://zoom.us/j/999'
});

assert.ok(msgInd.includes('nuestra sesión de terapia agendada'), 'El mensaje individual debe decir "sesión de terapia"');
console.log('✅ Test 2: Recordatorio de WhatsApp para Cita Individual validado con éxito.');

// 3. Evaluación: Cobro
const msgCobroEval = generarMensajeCobro({
  nombrePaciente: 'natalia',
  esEvaluacion: true,
  esGrupal: false,
  diaTexto: 'jueves',
  diaNum: 3,
  mesTexto: 'septiembre',
  horaLimpia: '07:00 a.m',
  bloqueDatos: '\n• Aportación: $4,000.00 MXN'
});

assert.ok(msgCobroEval.includes('respecto a tu sesión de evaluación del'), 'El cobro de evaluación debe decir "sesión de evaluación"');
assert.ok(!msgCobroEval.includes('respecto a tu sesión de terapia del'), 'El cobro de evaluación NO debe decir "sesión de terapia"');
console.log('✅ Test 3: Solicitud de pago de WhatsApp para Evaluación validado con éxito.');

// 4. Validación de teléfono
assert.strictEqual(validarYLimpiarTelefono('+52 55 1234 5678'), '525512345678');
assert.strictEqual(validarYLimpiarTelefono('5512345678'), '525512345678');
assert.strictEqual(validarYLimpiarTelefono('+52'), null, 'Solo "+52" debe ser rechazado como inválido');
assert.strictEqual(validarYLimpiarTelefono('123'), null, 'Menos de 10 dígitos debe ser rechazado');
console.log('✅ Test 4: Validación de teléfono (mínimo 10 dígitos y descarte de solo prefijo) validada con éxito.');

console.log('\n🎉 ¡TODOS LOS TESTS DE WHATSAPP PASARON CON 100% DE ÉXITO!');
