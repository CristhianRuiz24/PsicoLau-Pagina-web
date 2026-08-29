const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    // Buscar usuaria en la base de datos (búsqueda insensible a mayúsculas)
    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: emailNormalizado, mode: 'insensitive' } }
    });

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Verificar contraseña con bcrypt
    const isMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Generar el token JWT (Vigencia ajustada a 8 horas por seguridad clínica)
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
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
