const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const routes = require('./routes');

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors()); // Permitir cualquier origen temporalmente para pruebas locales
app.use(express.json());

// Montar todas las rutas
app.use('/api', routes);

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
