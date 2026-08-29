const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Captura de errores no controlados a nivel de proceso
process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

// Verificación de variables de entorno críticas al arranque (Fail-Fast)
const checkCriticalEnv = () => {
  const missing = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 16) {
    missing.push('JWT_SECRET (debe estar definido y tener al menos 16 caracteres)');
  }
  if (!process.env.ENCRYPTION_KEY || Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length !== 32) {
    missing.push('ENCRYPTION_KEY (debe ser una cadena hexadecimal de 32 bytes / 64 caracteres)');
  }
  if (missing.length > 0) {
    console.error('CRITICAL CONFIGURATION ERROR: Faltan variables de entorno requeridas:');
    missing.forEach(m => console.error(`  - ${m}`));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
checkCriticalEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar trust proxy para despliegues detrás de proxies (Render, Cloudflare)
app.set('trust proxy', 1);

const routes = require('./routes');

// Middlewares de seguridad y parseo
app.use(helmet());

// Normalización de orígenes permitidos
const normalizeUrl = (url) => url ? url.trim().replace(/\/+$/, '') : '';

const baseAllowedOrigins = [
  'https://psicolau.com',
  'https://www.psicolau.com',
  'https://api.psicolau.com'
];

if (process.env.FRONTEND_URL) {
  const normalizedFrontend = normalizeUrl(process.env.FRONTEND_URL);
  if (normalizedFrontend && !baseAllowedOrigins.includes(normalizedFrontend)) {
    baseAllowedOrigins.push(normalizedFrontend);
  }
}

const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  // En desarrollo (y al abrir archivos locales/file://), permitimos todo para facilitar pruebas
  app.use(cors());
} else {
  // Configuración de CORS estricta para producción (dominios exactos autorizados)
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) {
        // Permitir solicitudes del mismo origen / monitor health checks (ej. UptimeRobot)
        return callback(null, true);
      }
      const normalizedOrigin = normalizeUrl(origin);
      if (baseAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        const corsErr = new Error('No permitido por CORS');
        corsErr.status = 403;
        callback(corsErr);
      }
    },
    credentials: true
  }));
}

// Parseo de JSON con límite estricto de tamaño para prevenir ataques DoS
app.use(express.json({ limit: '100kb' }));

// Endpoint de prueba y salud de la API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Montar todas las rutas de la API
app.use('/api', routes);

// Middleware 404 para rutas no encontradas dentro de /api
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Middleware centralizado de manejo de errores
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  
  if (status >= 500) {
    console.error('Error no controlado en la aplicación:', err);
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(!isProd && { stack: err.stack })
  });
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`Servidor PsicoLau corriendo en el puerto ${PORT} (Entorno: ${process.env.NODE_ENV || 'development'})`);
});

