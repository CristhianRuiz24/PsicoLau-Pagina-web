import { test } from 'node:test';
import assert from 'node:assert';
import {
  detectarTipoCita,
  obtenerMontoSesion,
  formatearMoneda,
  obtenerCitasReportePeriodo
} from '../../panel/js/pagos/utils/contabilidad.js';

import {
  getMesReporte,
  getAnioReporte,
  setPeriodo
} from '../../panel/js/pagos/utils/periodo.js';

test('Módulos de Pagos y Contabilidad (Cálculos y Periodos)', async (t) => {
  console.log('--- Iniciando Test Unitario de Módulos de Pagos ---');

  await t.test('detectarTipoCita identifica correctamente categorías y prefijos', () => {
    const citaIndividual = { categoria: 'Ansiedad', paciente: { nombre: 'Juan Pérez' } };
    const citaGrupal = { categoria: '[GRUPAL] Taller', paciente: { nombre: 'Grupo Autoestima' } };
    const citaEvaluacion = { categoria: '[EVALUACION] Neuropsicología', paciente: { nombre: 'Carlos Ruiz' } };
    const citaBloqueo = { categoria: '[BLOQUEO] Personal', paciente: { nombre: '[BLOQUEO]' } };

    assert.strictEqual(detectarTipoCita(citaIndividual), 'INDIVIDUAL', 'Debe detectar INDIVIDUAL');
    assert.strictEqual(detectarTipoCita(citaGrupal), 'GRUPAL', 'Debe detectar GRUPAL');
    assert.strictEqual(detectarTipoCita(citaEvaluacion), 'EVALUACION', 'Debe detectar EVALUACION');
    assert.strictEqual(detectarTipoCita(citaBloqueo), 'BLOQUEO', 'Debe detectar BLOQUEO');
    console.log('✓ detectarTipoCita passed');
  });

  await t.test('obtenerMontoSesion respeta tarifas predeterminadas y cortesías', () => {
    const citaIndividual = { categoria: 'Ansiedad', paciente: { nombre: 'Juan Pérez' } };
    const citaGrupal = { categoria: '[GRUPAL] Taller', paciente: { nombre: 'Grupo Autoestima' } };
    const citaEvaluacion = { categoria: '[EVALUACION] Neuropsicología', paciente: { nombre: 'Carlos Ruiz' } };
    const citaBloqueo = { categoria: '[BLOQUEO] Personal', paciente: { nombre: '[BLOQUEO]' } };

    assert.strictEqual(obtenerMontoSesion(citaBloqueo), 0, 'Bloqueo debe ser $0');
    assert.strictEqual(obtenerMontoSesion({ ...citaIndividual, monto: 800 }), 800, 'Debe respetar monto explícito');
    assert.strictEqual(obtenerMontoSesion({ ...citaIndividual, monto: 0 }), 0, 'Debe respetar cortesía $0');
    assert.strictEqual(obtenerMontoSesion(citaIndividual), 500, 'Default individual debe ser 500');
    assert.strictEqual(obtenerMontoSesion(citaEvaluacion), 4000, 'Default evaluacion debe ser 4000');
    assert.strictEqual(obtenerMontoSesion(citaGrupal), 500, 'Default grupal debe ser 500');
    console.log('✓ obtenerMontoSesion passed');
  });

  await t.test('formatearMoneda formatea números a formato de divisa local', () => {
    const moneda = formatearMoneda(1500);
    assert.ok(moneda.includes('1,500') || moneda.includes('1.500'), 'Formateo monetario debe incluir 1500');
    console.log('✓ formatearMoneda passed:', moneda);
  });

  await t.test('periodo gestiona mes y año reactivo correctamente', () => {
    setPeriodo(8, 2026); // Septiembre 2026 (mes index 8)
    assert.strictEqual(getMesReporte(), 8);
    assert.strictEqual(getAnioReporte(), 2026);
    console.log('✓ periodo passed');
  });

  await t.test('obtenerCitasReportePeriodo filtra sesiones según reglas contables', () => {
    const listaCitas = [
      { id: 1, fechaHora: '2026-09-05T10:00:00Z', estado_cita: 'REALIZADA', estado_pago: 'PAGADO', paciente: { nombre: 'A' } },
      { id: 2, fechaHora: '2026-09-12T10:00:00Z', estado_cita: 'CANCELADA', estado_pago: 'PENDIENTE', paciente: { nombre: 'B' } }, // Excluida
      { id: 3, fechaHora: '2026-09-15T10:00:00Z', estado_cita: 'CANCELADA', estado_pago: 'PAGADO', paciente: { nombre: 'C' } }, // Incluida (ingreso real)
      { id: 4, fechaHora: '2026-09-20T10:00:00Z', categoria: '[BLOQUEO]', estado_cita: 'CONFIRMADA', estado_pago: 'PENDIENTE' }, // Excluida (bloqueo)
      { id: 5, fechaHora: '2026-08-10T10:00:00Z', estado_cita: 'REALIZADA', estado_pago: 'PAGADO', paciente: { nombre: 'D' } }, // Excluida (otro mes)
    ];

    const filtradas = obtenerCitasReportePeriodo(listaCitas, 8, 2026);
    assert.strictEqual(filtradas.length, 2, 'Debe incluir solo cita 1 y cita 3');
    assert.strictEqual(filtradas[0].id, 1);
    assert.strictEqual(filtradas[1].id, 3);
    console.log('✓ obtenerCitasReportePeriodo passed');
  });

  console.log('=== TODOS LOS TESTS PASARON EXITOSAMENTE (100% OK) ===');
});
