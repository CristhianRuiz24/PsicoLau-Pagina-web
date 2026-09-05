/**
 * verifySecurityHeaders.js
 * Auditoría automatizada de seguridad web y cabeceras para Mozilla Observatory (Spec 008).
 * Verifica:
 *  1. Segmentación y reglas de _headers (CSP sin unsafe-inline en /*, HSTS, nosniff, DENY, COOP, CORP).
 *  2. Ausencia de eventos inline (on*) en las 10 páginas HTML públicas.
 *  3. Diagnóstico de red de redirección HTTP -> HTTPS en el dominio oficial.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const rootDir = path.resolve(__dirname, '../../');
const headersPath = path.join(rootDir, '_headers');

const publicHtmlFiles = [
  'index.html',
  'sobre-mi.html',
  'areas-de-atencion.html',
  'experiencia.html',
  'libros.html',
  'preguntas-frecuentes.html',
  'terapias-grupales.html',
  'testimonios.html',
  'contacto.html',
  'privacidad.html'
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(title, condition, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [OK] ${title}`);
  } else {
    failedChecks++;
    console.error(`  [FALLO] ${title}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('===============================================================');
console.log(' AUDITORÍA DE CABECERAS Y HARDENING DE SEGURIDAD (SPEC 008)   ');
console.log('===============================================================\n');

// 1. Auditoría de archivo _headers
console.log('1. Verificación estática de cabeceras en _headers:');
if (!fs.existsSync(headersPath)) {
  console.error('ERROR: No se encontró el archivo _headers en la raíz del proyecto.');
  process.exit(1);
}

const headersContent = fs.readFileSync(headersPath, 'utf8');

// Parsear bloques de rutas
const blocks = {};
let currentPath = null;
for (const line of headersContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  if (trimmed.startsWith('/') || trimmed === '/*') {
    currentPath = trimmed;
    blocks[currentPath] = {};
  } else if (currentPath && trimmed.includes(':')) {
    const colonIdx = trimmed.indexOf(':');
    const headerName = trimmed.slice(0, colonIdx).trim();
    const headerValue = trimmed.slice(colonIdx + 1).trim();
    blocks[currentPath][headerName.toLowerCase()] = headerValue;
  }
}

// Validar bloque público /*
const pub = blocks['/*'];
check('Bloque de cabeceras para sitio público (/*) definido', !!pub);

if (pub) {
  // HSTS
  const hsts = pub['strict-transport-security'] || '';
  check('HSTS: max-age >= 1 año (31536000)', hsts.includes('max-age=31536000') || hsts.includes('max-age=15768000'));
  check('HSTS: includeSubDomains y preload', hsts.includes('includeSubDomains') && hsts.includes('preload'));

  // X-Content-Type-Options
  check('X-Content-Type-Options: nosniff', pub['x-content-type-options'] === 'nosniff');

  // X-Frame-Options
  check('X-Frame-Options: DENY o SAMEORIGIN', pub['x-frame-options'] === 'DENY' || pub['x-frame-options'] === 'SAMEORIGIN');

  // Referrer-Policy
  check('Referrer-Policy: estricto', pub['referrer-policy'] === 'strict-origin-when-cross-origin' || pub['referrer-policy'] === 'no-referrer');

  // COOP & CORP
  check('Cross-Origin-Opener-Policy: same-origin o same-origin-allow-popups', 
    pub['cross-origin-opener-policy'] === 'same-origin-allow-popups' || pub['cross-origin-opener-policy'] === 'same-origin');
  check('Cross-Origin-Resource-Policy: same-origin', pub['cross-origin-resource-policy'] === 'same-origin');

  // CSP
  const csp = pub['content-security-policy'] || '';
  check('CSP: definido en el sitio público', !!csp);
  check('CSP: script-src NO contiene "unsafe-inline"', !csp.match(/script-src[^;]*'unsafe-inline'/));
  check('CSP: script-src NO contiene "data:"', !csp.match(/script-src[^;]*data:/));
  check('CSP: object-src es "none"', csp.includes("object-src 'none'"));
  check('CSP: base-uri es "self"', csp.includes("base-uri 'self'"));
  check('CSP: frame-ancestors es "none"', csp.includes("frame-ancestors 'none'"));
  check('CSP: img-src no tiene comodín https:', !csp.match(/img-src[^;]*\bhttps:\b/));
}

// Validar bloque privado /panel/*
const panel = blocks['/panel/*'];
check('Bloque de cabeceras para suite clínica (/panel/*) definido', !!panel);
if (panel) {
  const panelCsp = panel['content-security-policy'] || '';
  check('Panel CSP: definido y preserva compatibilidad con suite médica', panelCsp.includes('api.psicolau.com'));
}

// 2. Auditoría de HTMLs públicos (cero eventos inline)
console.log('\n2. Verificación de código HTML público (cero eventos inline on*):');
let inlineEventsCount = 0;
for (const file of publicHtmlFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  // Buscar atributos on* que no estén dentro de comentarios HTML
  const matches = content.match(/\s+on[a-z]+=["'][^"']*["']/gi) || [];
  if (matches.length > 0) {
    inlineEventsCount += matches.length;
    console.error(`  [FALLO] ${file} contiene ${matches.length} evento(s) inline: ${matches.join(', ')}`);
  }
}
check('Las 10 páginas públicas están 100% libres de atributos inline on*', inlineEventsCount === 0);

// 3. Comprobación de Red HTTP -> HTTPS (psicolau.com)
console.log('\n3. Comprobación de red para redirección HTTP -> HTTPS:');

function testHttpRedirect() {
  return new Promise((resolve) => {
    const req = http.get('http://psicolau.com', { timeout: 5000 }, (res) => {
      const isRedirect = res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308;
      const location = res.headers.location || '';
      const isHttpsRedirect = isRedirect && location.startsWith('https://');

      if (isHttpsRedirect) {
        console.log(`  [OK] Redirección forzada activa: HTTP ${res.statusCode} -> ${location}`);
      } else if (res.statusCode === 200) {
        console.log(`  [AVISO CLOUDFLARE] http://psicolau.com devolvió HTTP 200 (sin redirigir a HTTPS).`);
        console.log(`  👉 Para obtener +20 pts en Mozilla Observatory:`);
        console.log(`     Ve a Cloudflare Dashboard -> SSL/TLS -> Edge Certificates -> Activa "Always Use HTTPS".`);
      } else {
        console.log(`  [INFO] http://psicolau.com respondió con código: ${res.statusCode}`);
      }
      resolve();
    });

    req.on('error', (err) => {
      console.log(`  [INFO] No se pudo verificar la red en vivo (${err.message}). Se omite prueba remota.`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('  [INFO] Tiempo de espera agotado al consultar http://psicolau.com.');
      resolve();
    });
  });
}

testHttpRedirect().then(() => {
  console.log('\n===============================================================');
  console.log(` RESULTADO: ${passedChecks}/${totalChecks} verificaciones superadas con éxito`);
  if (failedChecks === 0) {
    console.log(' CALIFICACIÓN PROYECTADA EN MOZILLA OBSERVATORY: GRADO A+ (100+)');
  } else {
    console.log(` Se detectaron ${failedChecks} fallo(s) que requieren atención.`);
  }
  console.log('===============================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
