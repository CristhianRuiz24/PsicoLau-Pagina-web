const express = require('express');
const router = express.Router();
const { enviarContacto } = require('../controllers/contactoController');
const rateLimit = require('express-rate-limit');

const contactoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});

router.post('/', contactoLimiter, enviarContacto);

module.exports = router;
