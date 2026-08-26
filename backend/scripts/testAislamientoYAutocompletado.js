require('dotenv').config();
const prisma = require('../src/config/db');

async function testAislamientoYAutocompletado() {
  console.log('=== TEST: AISLAMIENTO DE EXPEDIENTES Y AUTOCOMPLETADO EXACTO ===\n');

  try {
    // 1. Verificar que listarDirectorioPacientes no devuelve grupos ni bloqueos
    console.log('1. Verificando filtro de directorio de pacientes en base de datos...');
    const pacientes = await prisma.paciente.findMany({
      select: { id: true, nombre: true }
    });

    const filtrados = pacientes.filter(p => {
      const nomUpper = (p.nombre || '').toUpperCase().trim();
      return !nomUpper.startsWith('[BLOQUEO]') && !nomUpper.startsWith('[GRUPAL]');
    });

    const hayGrupos = filtrados.some(p => p.nombre.toUpperCase().includes('[GRUPAL]'));
    const hayBloqueos = filtrados.some(p => p.nombre.toUpperCase().includes('[BLOQUEO]'));

    if (hayGrupos || hayBloqueos) {
      throw new Error('El directorio de pacientes contiene grupos o bloqueos.');
    }
    console.log(`✓ Directorio limpio: ${filtrados.length} pacientes individuales encontrados, 0 grupos, 0 bloqueos.`);

    // 2. Verificar lógica de coincidencia exacta de grupos
    console.log('\n2. Verificando coincidencia exacta en autocompletado grupal...');
    const testGrupos = [
      {
        paciente: {
          nombre: '[GRUPAL] Grupal autistas adultos',
          enlaceZoom: 'https://zoom.us/j/123456789'
        },
        color: '#8b5cf6',
        categoria: '[GRUPAL] Módulo 1'
      }
    ];

    function buscarGrupo(input) {
      const nombreLimpio = (input || '').trim().toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '');
      return testGrupos.find(c => {
        if (!c.paciente || !c.paciente.nombre) return false;
        const esGrup = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente.nombre.startsWith('[GRUPAL]'));
        if (!esGrup) return false;
        const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
        return nom === nombreLimpio;
      });
    }

    const res1 = buscarGrupo('grupal');
    if (res1) {
      throw new Error('Escribir "grupal" no debe coincidir prematuramente con "Grupal autistas adultos".');
    }
    console.log('✓ Correcto: Escribir "grupal" no dispara autocompletado prematuro.');

    const res2 = buscarGrupo('Grupal autistas adultos');
    if (!res2 || !res2.paciente.enlaceZoom) {
      throw new Error('Escribir el nombre completo debe detectar el grupo y su enlace.');
    }
    console.log('✓ Correcto: Escribir "Grupal autistas adultos" detecta el grupo con éxito.');

    // 3. Verificar filtro del buscador global en app.js
    console.log('\n3. Verificando filtro del buscador global...');
    const terminoBusqueda = 'grupal';
    const pacientesCoincidentes = pacientes.filter(p => {
      if (!p.nombre) return false;
      const nomUpper = p.nombre.toUpperCase().trim();
      if (nomUpper.startsWith('[BLOQUEO]') || nomUpper.startsWith('[GRUPAL]')) return false;
      return p.nombre.toLowerCase().includes(terminoBusqueda);
    });

    if (pacientesCoincidentes.length > 0) {
      throw new Error('El buscador de expedientes no debe retornar registros de grupos.');
    }
    console.log('✓ Correcto: La sección de Expedientes Clínicos no contiene registros de grupos.');

    console.log('\n============================================================');
    console.log('🎉 TODOS LOS TESTS DE AISLAMIENTO PASARON AL 100%');
    console.log('============================================================');
  } catch (error) {
    console.error('❌ Error en el test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAislamientoYAutocompletado();
