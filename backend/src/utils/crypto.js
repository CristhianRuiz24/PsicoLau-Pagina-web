const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para AES-GCM

/**
 * Obtiene y valida el buffer de la clave criptográfica de 256 bits (32 bytes).
 */
const getKeyBuffer = () => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('CRITICAL SECURITY ERROR: La variable de entorno ENCRYPTION_KEY no está definida.');
  }

  const keyBuffer = Buffer.from(keyHex, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error(`CRITICAL SECURITY ERROR: ENCRYPTION_KEY debe ser de 32 bytes (64 caracteres hex). Longitud actual: ${keyBuffer.length} bytes.`);
  }

  return keyBuffer;
};

/**
 * Cifra un texto plano usando AES-256-GCM.
 * @param {string} texto Texto plano a cifrar.
 * @returns {string|null} Cadena en formato "ivHex:authTagHex:encryptedHex" o null si el texto es nulo/vacío.
 */
const cifrar = (texto) => {
  if (texto === null || texto === undefined || texto === '') {
    return null;
  }

  try {
    const key = getKeyBuffer();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const textoString = String(texto);
    let encrypted = cipher.update(textoString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:ciphertext (todo en hexadecimal)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Error al cifrar dato clínico', error);
    throw new Error('Error de seguridad al procesar el cifrado del expediente.');
  }
};

/**
 * Descifra una cadena previamente cifrada con AES-256-GCM.
 * @param {string} textoCifrado Cadena en formato "ivHex:authTagHex:encryptedHex".
 * @returns {string|null} Texto original descifrado o null si la entrada es nula/vacía.
 */
const descifrar = (textoCifrado) => {
  if (textoCifrado === null || textoCifrado === undefined || textoCifrado === '') {
    return null;
  }

  try {
    const partes = String(textoCifrado).split(':');
    if (partes.length !== 3) {
      // Si no tiene el formato esperado (p.ej. datos preexistentes en texto plano), devolver texto original con advertencia
      logger.warn('[Crypto] El registro clínico no tiene formato cifrado estándar (iv:tag:cipher). Devolviendo valor original.');
      return textoCifrado;
    }

    const [ivHex, authTagHex, encryptedHex] = partes;
    const key = getKeyBuffer();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Error al descifrar dato clínico (posible alteración o clave incorrecta)', error);
    return null;
  }
};

/**
 * Valida si una cadena cumple con el formato canónico AES-256-GCM (iv:authTag:ciphertext).
 * @param {string} texto
 * @returns {boolean}
 */
const esCifrado = (texto) => {
  if (!texto || typeof texto !== 'string') return false;
  const partes = texto.split(':');
  if (partes.length !== 3) return false;
  const [iv, tag, cipher] = partes;
  return /^[0-9a-f]{24}$/i.test(iv) && /^[0-9a-f]{32}$/i.test(tag) && /^[0-9a-f]+$/i.test(cipher);
};

/**
 * Genera un índice ciego determinista (Blind Index) seguro usando HMAC-SHA256 con ENCRYPTION_KEY.
 * Permite búsquedas exactas y unicidad en la base de datos sin revelar el valor en texto plano.
 * @param {string} texto
 * @returns {string|null} Hash hexadecimal o null si no se proporciona valor.
 */
const generarBlindIndex = (texto) => {
  if (texto === null || texto === undefined || String(texto).trim() === '') {
    return null;
  }
  try {
    const key = getKeyBuffer();
    return crypto.createHmac('sha256', key)
      .update(String(texto).toLowerCase().trim())
      .digest('hex');
  } catch (error) {
    logger.error('Error al generar blind index', error);
    throw new Error('Error criptográfico al generar índice ciego.');
  }
};

/**
 * Prepara y cifra los campos de Datos Personales Identificables (PII) de un paciente.
 * @param {Object} datos { nombre, telefono, email, enlaceZoom, ... }
 * @returns {Object} Objeto con campos cifrados y su correspondiente emailHash.
 */
const cifrarPaciente = (datos) => {
  if (!datos || typeof datos !== 'object') return datos;
  const resultado = { ...datos };

  // 1. Email y Blind Index
  if ('email' in resultado && resultado.email) {
    const emailStr = String(resultado.email).trim();
    if (!esCifrado(emailStr)) {
      resultado.emailHash = generarBlindIndex(emailStr);
      resultado.email = cifrar(emailStr);
    } else if (!resultado.emailHash && datos.emailOriginal) {
      resultado.emailHash = generarBlindIndex(datos.emailOriginal);
    }
  }

  // 2. Nombre
  if ('nombre' in resultado && resultado.nombre) {
    const nomStr = String(resultado.nombre).trim();
    if (!esCifrado(nomStr)) {
      resultado.nombre = cifrar(nomStr);
    }
  }

  // 3. Teléfono
  if ('telefono' in resultado && resultado.telefono) {
    const telStr = String(resultado.telefono).trim();
    if (!esCifrado(telStr)) {
      resultado.telefono = cifrar(telStr);
    }
  }

  // 4. Enlace Zoom
  if ('enlaceZoom' in resultado && resultado.enlaceZoom) {
    const zoomStr = String(resultado.enlaceZoom).trim();
    if (!esCifrado(zoomStr)) {
      resultado.enlaceZoom = cifrar(zoomStr);
    }
  }

  return resultado;
};

/**
 * Descifra transparentemente en memoria los campos PII de un paciente.
 * Si algún campo ya está en texto plano (fallback seguro), lo conserva intacto.
 * @param {Object} paciente Registro de paciente de Prisma
 * @returns {Object|null} Paciente con campos en texto plano para clientes autenticados.
 */
const descifrarPaciente = (paciente) => {
  if (!paciente || typeof paciente !== 'object') return paciente;
  const copia = { ...paciente };

  if (copia.nombre && esCifrado(copia.nombre)) {
    copia.nombre = descifrar(copia.nombre) || copia.nombre;
  }

  if (copia.telefono && esCifrado(copia.telefono)) {
    copia.telefono = descifrar(copia.telefono) || copia.telefono;
  }

  if (copia.email && esCifrado(copia.email)) {
    copia.email = descifrar(copia.email) || copia.email;
  }

  if (copia.enlaceZoom && esCifrado(copia.enlaceZoom)) {
    copia.enlaceZoom = descifrar(copia.enlaceZoom) || copia.enlaceZoom;
  }

  return copia;
};

module.exports = {
  cifrar,
  descifrar,
  encrypt: cifrar,
  decrypt: descifrar,
  esCifrado,
  generarBlindIndex,
  cifrarPaciente,
  descifrarPaciente
};

