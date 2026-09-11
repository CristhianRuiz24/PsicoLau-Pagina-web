const express = require('express');
const router = express.Router();
const { enviarContacto } = require('../controllers/contactoController');
const rateLimit = require('express-rate-limit');

const { debeOmitirRateLimit } = require('../utils/rateLimitHelpers');

const contactoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  validate: { xForwardedForHeader: false },
  skip: (req) => debeOmitirRateLimit(req),
  message: { success: false, message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});

router.post('/', contactoLimiter, enviarContacto);

module.exports = router;
