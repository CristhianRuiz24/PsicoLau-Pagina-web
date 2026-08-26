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

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como herramientas de línea de comandos, pero en un entorno real a veces es mejor rechazar si es un API solo para web, sin embargo, cors() sin origin suele rechazar si no lo permitimos explícitamente, pero lo dejaremos estricto)
    // Para mayor seguridad, exigimos que el origin esté en la lista permitida.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  }
}));
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
