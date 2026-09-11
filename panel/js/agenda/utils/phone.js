// panel/js/agenda/utils/phone.js
// RF-05 & Shared: Parseo de números telefónicos internacionales y gestión del input de teléfono

export function parsearTelefono(telCompleto) {
  if (!telCompleto) return { prefijo: '+52', numero: '' };
  const str = telCompleto.trim();
  const prefijosConocidos = [
    '+593', '+502', '+506', '+503', '+504', '+505', '+507', '+598',
    '+52', '+57', '+54', '+56', '+51', '+58', '+49', '+33', '+44', '+39', '+41', '+34', '+1'
  ];

  for (const p of prefijosConocidos) {
    if (str.startsWith(p)) {
      return { prefijo: p, numero: str.substring(p.length).trim() };
    }
  }

  if (str.startsWith('+')) {
    return { prefijo: '', numero: str };
  }

  // Si no tiene '+' y tiene 10 dígitos, asumir México (+52) por defecto
  return { prefijo: '+52', numero: str };
}

export function actualizarPlaceholderTelefono(prefijo) {
  const telInput = document.getElementById('nc_telefono');
  if (!telInput) return;
  if (!prefijo) {
    telInput.placeholder = '+[Código] [Número] (ej: +55 11 99999-9999)';
    if (!telInput.value.startsWith('+')) {
      telInput.value = '+';
      telInput.focus();
    }
  } else {
    telInput.placeholder = 'Número de WhatsApp (opcional)';
    if (telInput.value === '+') {
      telInput.value = '';
    }
  }
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.parsearTelefono = parsearTelefono;
  window.actualizarPlaceholderTelefono = actualizarPlaceholderTelefono;
}
