/**
 * testContadoresSemanales.js
 * 
 * Valida que el cálculo de métricas de la semana visible en la matriz:
 * 1. Excluya bloqueos de horario.
 * 2. Incluya consultas individuales, evaluaciones y terapias grupales.
 * 3. Contabilice adecuadamente las pagadas y las pendientes con monto > 0.
 * 4. No cuente como "por pagar" las sesiones de cortesía ($0).
 */

const assert = require('assert');

function calcularContadoresSemana(citasEstaSemana) {
  let countTotal = 0;
  let countPagadas = 0;
  let countPorPagar = 0;

  citasEstaSemana.forEach(c => {
    const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[BLOQUEO]'));
    if (!esBloqueo) {
      countTotal++;
      const monto = typeof c.monto === 'number' ? c.monto : 500;
      if (c.estado_pago === 'PAGADO') {
        countPagadas++;
      } else if (monto !== 0) {
        countPorPagar++;
      }
    }
  });

  return { countTotal, countPagadas, countPorPagar };
}

console.log('🧪 Iniciando verificación de contadores semanales...\n');

// Simular la semana visible de la Captura 3:
// - Elena Morales (Individual, Por Pagar)
// - Grupal autistas adultos xD (Grupal, Pagado)
// - comida (Bloqueo)
// - Grupal autistas adultos (Grupal, Por Pagar)
// - grupal (Grupal, Por Pagar)
// - 1 Cortesía $0 (Pendiente)
const citasSemana = [
  {
    id: 1,
    paciente: { nombre: 'Elena Morales Rivera' },
    categoria: 'Psicoterapia',
    monto: 500,
    estado_pago: 'PENDIENTE'
  },
  {
    id: 2,
    paciente: { nombre: '[GRUPAL] Grupal autistas adultos xD' },
    categoria: '[GRUPAL] Taller',
    monto: 1500,
    estado_pago: 'PAGADO'
  },
  {
    id: 3,
    paciente: { nombre: '[BLOQUEO] comida' },
    categoria: '[BLOQUEO] Almuerzo',
    monto: 0,
    estado_pago: 'PENDIENTE'
  },
  {
    id: 4,
    paciente: { nombre: '[GRUPAL] Grupal autistas adultos' },
    categoria: '[GRUPAL] Taller',
    monto: 1500,
    estado_pago: 'PENDIENTE'
  },
  {
    id: 5,
    paciente: { nombre: '[GRUPAL] grupal' },
    categoria: '[GRUPAL] Grupo',
    monto: 1000,
    estado_pago: 'PENDIENTE'
  },
  {
    id: 6,
    paciente: { nombre: 'Paciente Cortesía' },
    categoria: 'Cortesía de revisión',
    monto: 0,
    estado_pago: 'PENDIENTE'
  }
];

const stats = calcularContadoresSemana(citasSemana);

// De las 6 citas:
// 1 es bloqueo -> excluida.
// Quedan 5 citas clínicas (1 individual, 3 grupales, 1 cortesía).
assert.strictEqual(stats.countTotal, 5, 'countTotal debe ser 5 (todas las sesiones clínicas menos bloqueo)');
// 1 pagada (la grupal pagada)
assert.strictEqual(stats.countPagadas, 1, 'countPagadas debe ser 1 (la grupal pagada debe sumar a pagadas)');
// 3 por pagar (Elena + 2 grupales con costo; la cortesía de $0 no suma a por pagar)
assert.strictEqual(stats.countPorPagar, 3, 'countPorPagar debe ser 3 (individual + 2 grupales con monto pendiente)');

console.log(`✅ Conteo Total: ${stats.countTotal} citas clínicas (Esperado: 5)`);
console.log(`✅ Pagadas: ${stats.countPagadas} pagadas (Esperado: 1)`);
console.log(`✅ Por Pagar: ${stats.countPorPagar} por pagar (Esperado: 3)`);

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CONTADORES SEMANALES PASARON CON ÉXITO!');
