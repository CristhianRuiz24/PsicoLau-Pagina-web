/**
 * testConsentimientoLFPDPPP.js
 * 
 * Suite de pruebas automatizadas para la verificación de Consentimiento Informado (Spec 021 - LFPDPPP).
 * Valida:
 * 1. Validación semántica del schema Zod (rechazo ante omisión, false o tipo no booleano).
 * 2. Rechazo HTTP 400 ante solicitudes sin privacyCheck o con false.
 * 3. Procesamiento HTTP 200 ante solicitudes legítimas con privacyCheck: true.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { contactoSchema } = require('../src/utils/validators');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api/contacto`;

test('Suite Spec 021: Validación de Consentimiento Informado LFPDPPP', async (t) => {

  await t.test('1. contactoSchema valida correctamente privacyCheck: true a nivel unitario', () => {
    const dataValida = {
      nombre: 'Consultante Ana Torres',
      email: 'ana.torres@local.com',
      telefono: '+52 55 1234 5678',
      categoria: 'ansiedad_depresion',
      mensaje: 'Hola, requiero información para una sesión de valoración.',
      privacyCheck: true
    };

    const resultado = contactoSchema.safeParse(dataValida);
    assert.strictEqual(resultado.success, true, 'Debe ser válido con privacyCheck: true');
  });

  await t.test('2. contactoSchema rechaza la omisión de privacyCheck con mensaje explicativo', () => {
    const dataSinConsentimiento = {
      nombre: 'Consultante Ana Torres',
      email: 'ana.torres@local.com',
      mensaje: 'Hola, requiero información para una sesión de valoración.'
    };

    const resultado = contactoSchema.safeParse(dataSinConsentimiento);
    assert.strictEqual(resultado.success, false, 'Debe fallar si no se proporciona privacyCheck');
    const mensajeError = resultado.error.errors.map(e => e.message).join(' ');
    assert.ok(
      mensajeError.includes('Debes aceptar el Aviso de Privacidad') || mensajeError.includes('privacyCheck') || mensajeError.includes('Required'),
      'El error debe referenciar la necesidad de aceptar el Aviso de Privacidad'
    );
  });

  await t.test('3. contactoSchema rechaza privacyCheck: false', () => {
    const dataFalse = {
      nombre: 'Consultante Ana Torres',
      email: 'ana.torres@local.com',
      mensaje: 'Hola, requiero información para una sesión de valoración.',
      privacyCheck: false
    };

    const resultado = contactoSchema.safeParse(dataFalse);
    assert.strictEqual(resultado.success, false, 'Debe fallar si privacyCheck es false');
    const mensajeError = resultado.error.errors.map(e => e.message).join(' ');
    assert.ok(
      mensajeError.includes('Debes aceptar el Aviso de Privacidad'),
      'El mensaje de error debe indicar que debe aceptar el Aviso de Privacidad'
    );
  });

  await t.test('4. contactoSchema rechaza valores no booleanos (ej. string "true")', () => {
    const dataString = {
      nombre: 'Consultante Ana Torres',
      email: 'ana.torres@local.com',
      mensaje: 'Hola, requiero información para una sesión de valoración.',
      privacyCheck: 'true'
    };

    const resultado = contactoSchema.safeParse(dataString);
    assert.strictEqual(resultado.success, false, 'Debe fallar si privacyCheck no es un booleano estricto');
  });

  await t.test('5. Servidor HTTP rechaza petición sin privacyCheck con HTTP 400 Bad Request', async () => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Usuario Sin Consentimiento',
        email: 'sin-consentimiento@local.com',
        mensaje: 'Prueba de intento de envío sin aceptar privacidad.'
      })
    });

    const data = await response.json();
    assert.strictEqual(response.status, 400, 'Debe responder con HTTP 400 Bad Request');
    assert.strictEqual(data.success, false);
    assert.ok(
      (data.message || '').includes('Aviso de Privacidad') || (data.message || '').includes('privacyCheck'),
      'La respuesta debe advertir sobre la falta de aceptación del Aviso de Privacidad'
    );
  });

  await t.test('6. Servidor HTTP rechaza petición con privacyCheck: false con HTTP 400 Bad Request', async () => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Usuario Con False',
        email: 'false-consentimiento@local.com',
        mensaje: 'Prueba de intento de envío con false.',
        privacyCheck: false
      })
    });

    const data = await response.json();
    assert.strictEqual(response.status, 400, 'Debe responder con HTTP 400 Bad Request');
    assert.strictEqual(data.success, false);
  });

  await t.test('7. Servidor HTTP procesa exitosamente petición con privacyCheck: true (HTTP 200)', async () => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Consultante Legítimo LFPDPPP',
        email: 'consultante.lfpdppp@local.com',
        telefono: '+52 55 9876 5432',
        categoria: 'neurodivergencias',
        mensaje: 'Mensaje legítimo con consentimiento formalmente aceptado.',
        privacyCheck: true
      })
    });

    const data = await response.json();
    assert.strictEqual(response.status, 200, 'Debe responder con HTTP 200 OK');
    assert.strictEqual(data.success, true);
    assert.ok(data.message.includes('correctamente') || data.message.includes('éxito'));
  });

});
