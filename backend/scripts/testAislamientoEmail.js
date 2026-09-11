/**
 * testAislamientoEmail.js
 * 
 * Suite de pruebas automatizadas para el Aislamiento de Correos (Spec 016).
 * Verifica las 3 capas de defensa contra envíos accidentales y rebotes en Resend:
 * 1. Aislamiento por entorno (NODE_ENV === 'test').
 * 2. Filtro anti-rebote para dominios ficticios (@local.com, @test.com, etc.).
 * 3. Protección de la bandeja de Laura en desarrollo local.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const {
  enviarEmailResend,
  enviarConfirmacionPaciente,
  enviarAvisoLaura,
  enviarMensajeContacto,
  esDominioFicticio
} = require('../src/services/emailService');

test('Suite Spec 016: Aislamiento de Correos en Entornos de Pruebas y Desarrollo', async (t) => {

  await t.test('1. Helper esDominioFicticio identifica correctamente dominios de prueba', () => {
    assert.strictEqual(esDominioFicticio('test@local.com'), true);
    assert.strictEqual(esDominioFicticio('paciente.legitimo.1789152140037@local.com'), true);
    assert.strictEqual(esDominioFicticio('usuario@test.com'), true);
    assert.strictEqual(esDominioFicticio('fake@example.com'), true);
    assert.strictEqual(esDominioFicticio('bot@fake.com'), true);
    assert.strictEqual(esDominioFicticio('servidor@servidor.local'), true);
    assert.strictEqual(esDominioFicticio('sin-email-1788371464168-1tx7gw1@local.com'), true);
    assert.strictEqual(esDominioFicticio(''), true);
    assert.strictEqual(esDominioFicticio(null), true);

    // Dominios de producción legítimos no deben ser marcados como ficticios
    assert.strictEqual(esDominioFicticio('lince_lg@yahoo.com.mx'), false);
    assert.strictEqual(esDominioFicticio('contacto@psicolau.com'), false);
    assert.strictEqual(esDominioFicticio('maria.gonzalez@gmail.com'), false);
  });

  await t.test('2. enviarEmailResend simula envío en modo NODE_ENV=test (RF-1)', async () => {
    const backupEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      const res = await enviarEmailResend({
        to: 'paciente.real@gmail.com',
        subject: 'Prueba unitaria en test',
        html: '<p>Contenido</p>'
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.simulated, true);
      assert.strictEqual(res.id, 'test-mock-id');
    } finally {
      process.env.NODE_ENV = backupEnv;
    }
  });

  await t.test('3. enviarEmailResend intercepta correos a dominios ficticios aun en modo desarrollo (RF-2)', async () => {
    const backupEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const res = await enviarEmailResend({
        to: 'paciente.ficticio.123@local.com',
        subject: 'Cita solicitada',
        html: '<p>Contenido</p>'
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.simulated, true);
      assert.strictEqual(res.id, 'test-ficticio-mock-id');
    } finally {
      process.env.NODE_ENV = backupEnv;
    }
  });

  await t.test('4. enviarEmailResend protege la bandeja de Laura en desarrollo si no se fuerza (RF-3)', async () => {
    const backupEnv = process.env.NODE_ENV;
    const backupOverride = process.env.ENABLE_REAL_EMAILS_DEV;
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_REAL_EMAILS_DEV;

    try {
      const res = await enviarEmailResend({
        to: 'lince_lg@yahoo.com.mx',
        subject: 'Nueva solicitud de cita simulada',
        html: '<p>Aviso a Laura</p>'
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.simulated, true);
      assert.strictEqual(res.id, 'dev-laura-mock-id');
    } finally {
      process.env.NODE_ENV = backupEnv;
      if (backupOverride) process.env.ENABLE_REAL_EMAILS_DEV = backupOverride;
    }
  });

  await t.test('5. Helpers de negocio (confirmación, aviso Laura, contacto) ejecutan sin excepciones en modo test', async () => {
    const backupEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      const resConf = await enviarConfirmacionPaciente('paciente@test.com', 'María José', new Date());
      assert.strictEqual(resConf.success, true);
      assert.strictEqual(resConf.simulated, true);

      const resAviso = await enviarAvisoLaura({
        paciente: { nombre: 'Paciente Test', email: 'paciente@test.com', telefono: '5512345678' },
        fechaHora: new Date(),
        categoria: 'Individual'
      });
      assert.strictEqual(resAviso.success, true);
      assert.strictEqual(resAviso.simulated, true);

      const resContacto = await enviarMensajeContacto({
        nombre: 'Interesado Test',
        email: 'interesado@test.com',
        telefono: '5512345678',
        categoria: 'Terapia individual',
        mensaje: 'Hola quiero informes'
      });
      assert.strictEqual(resContacto.success, true);
      assert.strictEqual(resContacto.simulated, true);
    } finally {
      process.env.NODE_ENV = backupEnv;
    }
  });

});
