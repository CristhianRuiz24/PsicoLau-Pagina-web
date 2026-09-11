/**
 * runTests.js
 * Orquestador y runner unificado para la suite de pruebas del backend de PsicoLau (Spec 014).
 * 
 * - Verifica si el servidor backend está activo en localhost:3001.
 * - Si no está activo, levanta automáticamente una instancia temporal para los tests.
 * - Ejecuta la suite de pruebas con el motor nativo de Node.js (node --test --test-concurrency=1).
 * - Cierra de forma limpia el servidor temporal al terminar y propaga el código de salida.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

process.env.NODE_ENV = 'test';

const BACKEND_DIR = path.resolve(__dirname, '..');
const SCRIPTS_DIR = __dirname;
const PORT = process.env.TEST_PORT || 3099;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;

let serverProcess = null;

async function isServerRunning() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startEphemeralServer() {
  console.log(`[Test Runner] Servidor no detectado en puerto ${PORT}. Levantando servidor temporal para pruebas...`);
  
  serverProcess = spawn('node', ['src/index.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'ignore'
  });

  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isServerRunning()) {
      console.log(`[Test Runner] Servidor de pruebas listo en ${HEALTH_URL}`);
      return;
    }
  }

  throw new Error(`[Test Runner] No se pudo inicializar el servidor de pruebas en ${HEALTH_URL}`);
}

function stopEphemeralServer() {
  if (serverProcess && !serverProcess.killed) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${serverProcess.pid} /T /F`, () => {});
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch {}
  }
}

function getTestFiles() {
  // Si se pasaron archivos específicos por línea de comando, utilizarlos
  const customArgs = process.argv.slice(2).filter(arg => !arg.startsWith('-'));
  if (customArgs.length > 0) {
    return customArgs;
  }

  // Descubrir todos los scripts test*.js, test*.mjs y verify*.js
  const files = fs.readdirSync(SCRIPTS_DIR);
  return files
    .filter(f => (f.startsWith('test') || f.startsWith('verify')) && (f.endsWith('.js') || f.endsWith('.mjs')) && f !== 'runTests.js')
    .sort()
    .map(f => path.join('scripts', f));
}

async function main() {
  const startedHere = !(await isServerRunning());
  if (startedHere) {
    await startEphemeralServer();
  } else {
    console.log(`[Test Runner] Conectando a servidor backend ya en ejecución en puerto ${PORT}...`);
  }

  const testFiles = getTestFiles();
  console.log(`[Test Runner] Ejecutando ${testFiles.length} archivos de prueba con node:test...\n`);

  const args = ['--test', '--test-concurrency=1', ...testFiles];
  const testProc = spawn('node', args, {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'inherit'
  });

  const cleanExit = (code) => {
    if (startedHere) {
      stopEphemeralServer();
    }
    process.exit(code ?? 0);
  };

  testProc.on('close', (code) => {
    cleanExit(code);
  });

  process.on('SIGINT', () => cleanExit(1));
  process.on('SIGTERM', () => cleanExit(1));
}

main().catch((err) => {
  console.error('❌ Error en Test Runner:', err);
  stopEphemeralServer();
  process.exit(1);
});
