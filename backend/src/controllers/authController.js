const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    // Acceso exclusivo de desarrollo local (inactivo y bloqueado en producción)
    const esEntornoLocal = process.env.NODE_ENV !== 'production';
    const esHostLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const esCredencialDev = (email === 'admin' || email === 'admin@local.com' || email === 'dev') && password === 'admin';

    if (esEntornoLocal && esHostLocal && esCredencialDev) {
      const tokenDev = jwt.sign(
        { id: 9999, email: 'dev@local.com', role: 'DEV_ADMIN' },
        process.env.JWT_SECRET || 'psicolau_dev_jwt_secret',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token: tokenDev,
        message: 'Acceso de desarrollo local concedido'
      });
    }

    // Buscar usuaria en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Verificar contraseña con bcrypt
    const isMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token válido por 24 horas
    );

    res.json({
      success: true,
      token,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { login };
