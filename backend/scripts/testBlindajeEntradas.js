/**
 * testBlindajeEntradas.js
 * 
 * Suite de pruebas adversarias y de abuso (Spec 015 - T4).
 * Verifica que el backend rechace estrictamente:
 * 1. Cargas de inyección de OWASP ZAP (URLs en nombres).
 * 2. Inyecciones XSS (<script>) en nombres, teléfonos y mensajes.
 * 3. Fórmulas de inyección CSV (=cmd, =HYPERLINK).
 * 4. Teléfonos no válidos o con letras.
 * 5. Spam de más de 2 URLs en mensajes de contacto.
 * 6. Admisión de nombres humanos legítimos con tildes, diéresis y guiones.
 * 7. Prefijos administrativos permitidos en agenda pero bloqueados en formulario público.
 * 8. Sanitización de celdas CSV para neutralización de fórmulas (CWE-1236).
 */

const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const { generarBlindIndex } = require('../src/utils/crypto');
const { citaSchema, contactoSchema, crearCitaAdminSchema } = require('../src/utils/validators');

test('Blindaje semántico contra inyecciones, URLs y abuso en formularios (Spec 015)', async () => {
  console.log('🧪 Iniciando pruebas de blindaje de entradas adversarias...\n');

  const PORT = process.env.PORT || 3001;
  const token = jwt.sign({ id: 1, email: 'test@psicolau.com' }, process.env.JWT_SECRET || 'secret123456789012345');
  const authHeader = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  const jsonHeader = { 'Content-Type': 'application/json' };

  let pacienteCreado = null;
  let citaAdminCreada = null;

  try {
    // --- TEST 1 (HTTP): Rechazo de payloads de OWASP ZAP en cita pública ---
    console.log('1. Probando rechazo de payload OWASP ZAP (URL como nombre) vía HTTP...');
    const resZap = await fetch(`http://localhost:${PORT}/api/citas/public`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify({
        nombre: 'http://www.google.com:80/search?q=ZAP',
        telefono: '+52 55 1234 5678',
        email: 'zap-test@local.com',
        fechaHora: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const dataZap = await resZap.json();
    assert.strictEqual(resZap.status, 400, 'Debe rechazar URLs con código 400');
    assert.strictEqual(dataZap.success, false);
    assert.ok(dataZap.message.toLowerCase().includes('url') || dataZap.message.toLowerCase().includes('enlace') || dataZap.message.toLowerCase().includes('nombre'));
    console.log('   ✅ Payload OWASP ZAP bloqueado correctamente con 400 Bad Request.');

    // --- TEST 2 (HTTP): Rechazo de inyección XSS en nombre ---
    console.log('\n2. Probando rechazo de payload XSS (<script>) vía HTTP...');
    const resXss = await fetch(`http://localhost:${PORT}/api/citas/public`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify({
        nombre: '<script>alert("xss")</script>',
        telefono: '+52 55 1234 5678',
        email: 'xss-test@local.com',
        fechaHora: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const dataXss = await resXss.json();
    assert.strictEqual(resXss.status, 400, 'Debe rechazar XSS con código 400');
    assert.strictEqual(dataXss.success, false);
    console.log('   ✅ Payload XSS bloqueado correctamente con 400 Bad Request.');

    // --- TEST 3 (HTTP): Rechazo de teléfono corrupto con letras ---
    console.log('\n3. Probando rechazo de teléfono con letras vía HTTP...');
    const resTel = await fetch(`http://localhost:${PORT}/api/citas/public`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify({
        nombre: 'Carlos Ramírez',
        telefono: '55-TELEFONO-FAKE',
        email: 'tel-test@local.com',
        fechaHora: new Date(Date.now() + 86400000).toISOString()
      })
    });
    assert.strictEqual(resTel.status, 400, 'Debe rechazar teléfono con letras');
    console.log('   ✅ Teléfono con letras rechazado limpiamente con 400 Bad Request.');

    // --- TEST 4 (HTTP): Rechazo de spam con > 2 URLs en formulario de contacto ---
    console.log('\n4. Probando rechazo de spam masivo de enlaces en formulario de contacto vía HTTP...');
    const resSpam = await fetch(`http://localhost:${PORT}/api/contacto`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify({
        nombre: 'Remitente Spam',
        email: 'spam@bot.com',
        mensaje: 'Visita http://sitio1.com y también www.sitio2.org y además https://sitio3.net para ofertas.',
        privacyCheck: true
      })
    });
    const dataSpam = await resSpam.json();
    assert.strictEqual(resSpam.status, 400, 'Debe rechazar spam de más de 2 URLs');
    assert.strictEqual(dataSpam.success, false);
    console.log('   ✅ Mensaje con spam de URLs rechazado con 400 Bad Request.');

    // --- TEST 5 (HTTP): Aceptación de nombre humano legítimo complejo ---
    console.log('\n5. Probando aceptación de nombre legítimo con acentos, eñes y guiones vía HTTP...');
    const emailLegitimo = `paciente.legitimo.${Date.now()}@local.com`;
    const resLegitimo = await fetch(`http://localhost:${PORT}/api/citas/public`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify({
        nombre: 'María José Peña-Nieto de Müller',
        telefono: '+52 (55) 1234-5678',
        email: emailLegitimo,
        fechaHora: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const dataLegitimo = await resLegitimo.json();
    assert.strictEqual(resLegitimo.status, 201, 'Nombre humano legítimo debe ser creado con 201');
    assert.strictEqual(dataLegitimo.success, true);
    pacienteCreado = await prisma.paciente.findFirst({ where: { emailHash: generarBlindIndex(emailLegitimo) } });
    assert.ok(pacienteCreado, 'El paciente legítimo debe persistirse en base de datos');
    console.log(`   ✅ Nombre humano legítimo aceptado y persistido (ID: ${pacienteCreado.id}).`);

    // --- TEST 6 (HTTP): Prefijo administrativo [GRUPAL] en ruta de agenda autenticada ---
    console.log('\n6. Probando prefijo administrativo [GRUPAL] en panel administrativo vía HTTP...');
    const resGrupalAdmin = await fetch(`http://localhost:${PORT}/api/agenda/citas`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        nombre: '[GRUPAL] Sesión Terapéutica Grupal Spec 015',
        fechaHora: new Date(Date.now() + 86400000).toISOString(),
        monto: 350,
        color: '#3EB8CC'
      })
    });
    const dataGrupalAdmin = await resGrupalAdmin.json();
    assert.strictEqual(resGrupalAdmin.status, 201, 'Prefijo [GRUPAL] debe ser admitido en panel');
    citaAdminCreada = dataGrupalAdmin.data;
    console.log('   ✅ Cita con prefijo [GRUPAL] creada exitosamente en panel.');

    // --- TEST 7 (SCHEMA UNIT): Validación de casos límite adversarios ---
    console.log('\n7. Probando matriz de casos límite con Zod Schema directo...');

    // A. Prefijo [GRUPAL] debe fallar en citaSchema pública
    assert.throws(() => {
      citaSchema.parse({
        nombre: '[GRUPAL] Grupo Público No Autorizado',
        telefono: '+52 55 1234 5678',
        email: 'test@mail.com',
        fechaHora: new Date()
      });
    }, /caracteres no permitidos/);

    // B. Inyección de fórmula CSV en nombre debe fallar en citaSchema pública
    assert.throws(() => {
      citaSchema.parse({
        nombre: '=cmd|\' /C calc\'!A0',
        telefono: '+52 55 1234 5678',
        email: 'test@mail.com',
        fechaHora: new Date()
      });
    }, /caracteres no permitidos/);

    // C. URLs en crearCitaAdminSchema deben fallar
    assert.throws(() => {
      crearCitaAdminSchema.parse({
        nombre: 'http://www.google.com:80/search?q=ZAP',
        fechaHora: new Date()
      });
    }, /URL o enlace externo/);

    // D. HTML en crearCitaAdminSchema debe fallar
    assert.throws(() => {
      crearCitaAdminSchema.parse({
        nombre: '<script>alert(1)</script>',
        fechaHora: new Date()
      });
    }, /HTML o código no permitido/);

    // E. HTML ejecutable en mensaje de contacto debe fallar
    assert.throws(() => {
      contactoSchema.parse({
        nombre: 'Ana Laura',
        email: 'ana@mail.com',
        mensaje: 'Hola <iframe src="evil.com"></iframe> mensaje'
      });
    }, /etiquetas HTML o código ejecutable/);

    console.log('   ✅ Matriz de casos límite adversarios verificada al 100%.');

    // --- TEST 8 (CSV UNIT): Verificación de neutralización de fórmulas CSV (CWE-1236) ---
    console.log('\n8. Probando neutralización de fórmulas CSV (CWE-1236)...');
    const { sanitizarCeldaCSV } = await import('../../panel/js/pagos/export/csv.js');
    
    assert.strictEqual(sanitizarCeldaCSV('=cmd|\' /C calc\'!A0'), '"\'=cmd|\' /C calc\'!A0"', 'Fórmulas con = deben tener prefijo \'');
    assert.strictEqual(sanitizarCeldaCSV('+1234567'), '"\'+1234567"', 'Fórmulas con + deben tener prefijo \'');
    assert.strictEqual(sanitizarCeldaCSV('-1000'), '"\'-1000"', 'Fórmulas con - deben tener prefijo \'');
    assert.strictEqual(sanitizarCeldaCSV('@SUM(A1:A10)'), '"\'@SUM(A1:A10)"', 'Fórmulas con @ deben tener prefijo \'');
    assert.strictEqual(sanitizarCeldaCSV('Elena Morales Rivera'), '"Elena Morales Rivera"', 'Nombres normales no deben tener prefijo \'');
    console.log('   ✅ Neutralización de fórmulas CSV verificada según estándar OWASP.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE BLINDAJE DE ENTRADAS PASARON CON 100% DE ÉXITO!');

  } finally {
    // Limpieza obligatoria constitucional de registros de prueba creados
    if (citaAdminCreada && citaAdminCreada.id) {
      await prisma.cita.delete({ where: { id: citaAdminCreada.id } }).catch(() => {});
      if (citaAdminCreada.pacienteId) {
        await prisma.paciente.delete({ where: { id: citaAdminCreada.pacienteId } }).catch(() => {});
      }
    }
    if (pacienteCreado && pacienteCreado.id) {
      await prisma.cita.deleteMany({ where: { pacienteId: pacienteCreado.id } }).catch(() => {});
      await prisma.paciente.delete({ where: { id: pacienteCreado.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});
