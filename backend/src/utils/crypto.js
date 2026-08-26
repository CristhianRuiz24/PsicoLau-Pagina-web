const crypto = require('crypto');

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
    console.error('Error al cifrar dato clínico:', error.message);
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
      // Si no tiene el formato esperado, se devuelve el texto original
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
    console.error('Error al descifrar dato clínico (posible alteración o clave incorrecta):', error.message);
    return null;
  }
};

module.exports = {
  cifrar,
  descifrar
};
