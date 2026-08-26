const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar trust proxy para despliegues detrás de proxies (Render, Cloudflare)
app.set('trust proxy', 1);

const routes = require('./routes');

// Middlewares de seguridad y parseo
app.use(helmet());
// Configuración de CORS estricta
const allowedOrigins = [
  'https://psicolau.com',
  'https://www.psicolau.com'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const isLocal = process.env.NODE_ENV !== 'production';

if (isLocal) {
  // En desarrollo (y al abrir archivos con file://), permitimos todo para facilitar pruebas
  app.use(cors());
} else {
  // Configuración de CORS estricta para producción
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    }
  }));
}
app.use(express.json());

// Montar todas las rutas
app.use('/api', routes);

// Endpoint de prueba y salud de la API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
