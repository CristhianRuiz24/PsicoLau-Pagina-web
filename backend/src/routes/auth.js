const express = require('express');
const router = express.Router();
const { login, cambiarPassword } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Limitar intentos de login para prevenir ataques de fuerza bruta (5 intentos / 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.' }
});

// Limitar intentos de cambio de contraseña (5 intentos / 15 min)
const cambiarPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiados intentos de cambio de contraseña. Por favor, intenta de nuevo en 15 minutos.' }
});

router.post('/login', loginLimiter, login);
router.put('/cambiar-password', verificarToken, cambiarPasswordLimiter, cambiarPassword);

module.exports = router;

