/**
 * testCifradoPacientes.js
 * 
 * Suite de pruebas automatizadas para el Cifrado Integral de Pacientes PII (Spec 017).
 * Verifica:
 * 1. Que los datos de Paciente se almacenen con cifrado AES-256-GCM (iv:authTag:ciphertext).
 * 2. Que ningún dato personal identificable (nombre, email, teléfono, zoom) se guarde en texto plano.
 * 3. Que el índice ciego determinista emailHash se calcule con HMAC-SHA256 y permita búsquedas exactas.
 * 4. Que descifrarPaciente() recupere con 100% de exactitud los valores originales.
 * 5. Que los 8 campos clínicos de Expediente sigan protegidos con AES-256-GCM.
 */

const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');
const {
  cifrarPaciente,
  descifrarPaciente,
  esCifrado,
  generarBlindIndex,
  descifrar
} = require('../src/utils/crypto');

test('Suite Spec 017: Cifrado Integral de Pacientes PII y Blindaje Clínico', async (t) => {
  let pacienteTestId = null;
  const emailOriginal = `paciente.pii.${Date.now()}@local.com`;
  const nombreOriginal = 'Sofía Guadalupe Hernández-Vargas';
  const telOriginal = '+52 (55) 9876-5432';
  const zoomOriginal = 'https://us06web.zoom.us/j/9988776655?pwd=ClaveUltraSecreta123';

  try {
    await t.test('1. Helper cifrarPaciente genera formato canónico AES-256-GCM y emailHash HMAC-SHA256', () => {
      const cifrado = cifrarPaciente({
        nombre: nombreOriginal,
        telefono: telOriginal,
        email: emailOriginal,
        enlaceZoom: zoomOriginal
      });

      assert.strictEqual(esCifrado(cifrado.nombre), true, 'El nombre debe estar en formato iv:tag:ciphertext');
      assert.strictEqual(esCifrado(cifrado.telefono), true, 'El teléfono debe estar en formato iv:tag:ciphertext');
      assert.strictEqual(esCifrado(cifrado.email), true, 'El correo debe estar en formato iv:tag:ciphertext');
      assert.strictEqual(esCifrado(cifrado.enlaceZoom), true, 'El Zoom debe estar en formato iv:tag:ciphertext');

      assert.notStrictEqual(cifrado.nombre, nombreOriginal, 'El nombre no debe ser igual al texto plano');
      assert.notStrictEqual(cifrado.email, emailOriginal, 'El email no debe ser igual al texto plano');

      const expectedHash = generarBlindIndex(emailOriginal);
      assert.strictEqual(cifrado.emailHash, expectedHash, 'emailHash debe coincidir con el HMAC-SHA256 calculado');
    });

    await t.test('2. Persistencia en Base de Datos: Verificación de Cero Texto Plano en Reposo', async () => {
      const datosParaGuardar = cifrarPaciente({
        nombre: nombreOriginal,
        telefono: telOriginal,
        email: emailOriginal,
        enlaceZoom: zoomOriginal,
        tarifaDefecto: 750
      });

      const pacienteCreado = await prisma.paciente.create({
        data: datosParaGuardar
      });
      pacienteTestId = pacienteCreado.id;

      // Consultar directamente de PostgreSQL sin descifrar
      const rowDirecta = await prisma.paciente.findUnique({
        where: { id: pacienteTestId }
      });

      assert.ok(rowDirecta, 'El registro debe existir en base de datos');
      assert.strictEqual(esCifrado(rowDirecta.nombre), true);
      assert.strictEqual(esCifrado(rowDirecta.telefono), true);
      assert.strictEqual(esCifrado(rowDirecta.email), true);
      assert.strictEqual(esCifrado(rowDirecta.enlaceZoom), true);

      // Certificar que NO hay texto plano en la base de datos
      assert.strictEqual(rowDirecta.nombre.includes('Sofía'), false, 'La base de datos NO debe contener el nombre real');
      assert.strictEqual(rowDirecta.email.includes(emailOriginal), false, 'La base de datos NO debe contener el email real');
      assert.strictEqual(rowDirecta.telefono.includes('9876-5432'), false, 'La base de datos NO debe contener el teléfono real');
      assert.strictEqual(rowDirecta.enlaceZoom.includes('ClaveUltraSecreta123'), false, 'La base de datos NO debe contener la clave de Zoom');
    });

    await t.test('3. Búsqueda exacta y unicidad en O(1) mediante Blind Index (emailHash)', async () => {
      const hashBuscado = generarBlindIndex(emailOriginal);
      const encontradoPorHash = await prisma.paciente.findFirst({
        where: { emailHash: hashBuscado }
      });

      assert.ok(encontradoPorHash, 'Debe localizar el paciente mediante su emailHash');
      assert.strictEqual(encontradoPorHash.id, pacienteTestId);
    });

    await t.test('4. Helper descifrarPaciente restaura los valores originales en memoria', async () => {
      const rowDirecta = await prisma.paciente.findUnique({
        where: { id: pacienteTestId }
      });

      const descifrado = descifrarPaciente(rowDirecta);
      assert.strictEqual(descifrado.nombre, nombreOriginal);
      assert.strictEqual(descifrado.telefono, telOriginal);
      assert.strictEqual(descifrado.email, emailOriginal);
      assert.strictEqual(descifrado.enlaceZoom, zoomOriginal);
      assert.strictEqual(descifrado.tarifaDefecto, 750);
    });

    await t.test('5. Ratificación de Cifrado en Expedientes Clínicos (AES-256-GCM)', async () => {
      // Verificar que todos los expedientes existentes sigan cifrados
      const expedientes = await prisma.expediente.findMany({ take: 5 });
      const campos = ['estadoActual', 'insightPaciente', 'eventoPrincipal', 'intervenciones', 'formulacionClinica', 'tareasAsignadas', 'pendientesProximaSesion', 'resumenBreve'];

      for (const exp of expedientes) {
        for (const c of campos) {
          const val = exp[c];
          if (val) {
            assert.strictEqual(esCifrado(val), true, `El campo ${c} del expediente ${exp.id} debe ser AES-256-GCM`);
            const texto = descifrar(val);
            assert.ok(typeof texto === 'string' && texto.length > 0, `El campo ${c} debe ser descifrable`);
          }
        }
      }
    });

  } finally {
    // Limpieza estricta constitucional
    if (pacienteTestId) {
      await prisma.paciente.deleteMany({ where: { id: pacienteTestId } });
    }
    await prisma.$disconnect();
  }
});
