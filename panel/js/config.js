// --- Configuración y Estado Global de la Suite Clínica ---

const isLocal = window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  /^192\.168\./.test(window.location.hostname) ||
  /^10\./.test(window.location.hostname) ||
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname) ||
  window.location.protocol === 'file:' ||
  !window.location.hostname;

const API_URL = isLocal
  ? `http://${window.location.hostname || 'localhost'}:3001/api`
  : (window.PSICOLAU_API_URL || 'https://api.psicolau.com/api');


const PALETA_COLORES = [
  // Rosas y Corales (Marca PsicoLau)
  { nombre: 'Rosa PsicoLau (Oficial)', hex: '#EC5E86' },
  { nombre: 'Fucsia / Rosa Intenso', hex: '#ec4899' },
  { nombre: 'Rosa Pastel', hex: '#f472b6' },
  { nombre: 'Coral Suave', hex: '#fb7185' },
  
  // Turquesas y Azules
  { nombre: 'Turquesa PsicoLau (Oficial)', hex: '#3EB8CC' },
  { nombre: 'Cian / Aguamarina', hex: '#06b6d4' },
  { nombre: 'Azul Cielo Pastel', hex: '#38bdf8' },
  { nombre: 'Azul Eléctrico', hex: '#6366f1' },
  { nombre: 'Azul Marino / Zafiro', hex: '#2563eb' },
  
  // Morados y Lavandas
  { nombre: 'Morado Intenso', hex: '#9333ea' },
  { nombre: 'Lavanda Suave', hex: '#c084fc' },
  { nombre: 'Violeta Real', hex: '#7c3aed' },
  { nombre: 'Orquídea', hex: '#a855f7' },
  
  // Verdes y Mentas
  { nombre: 'Verde Esmeralda', hex: '#10b981' },
  { nombre: 'Verde Menta', hex: '#14b8a6' },
  { nombre: 'Verde Lima', hex: '#84cc16' },
  { nombre: 'Verde Jade', hex: '#059669' },
  
  // Amarillos y Naranjas
  { nombre: 'Amarillo Mostaza', hex: '#eab308' },
  { nombre: 'Ámbar Cálido', hex: '#f59e0b' },
  { nombre: 'Naranja Mandarina', hex: '#f97316' },
  { nombre: 'Terracota', hex: '#ea580c' },
  
  // Neutros y Bloqueos
  { nombre: 'Gris Neutro / Bloqueo', hex: '#94a3b8' },
  { nombre: 'Pizarra / Grafito', hex: '#475569' },
  { nombre: 'Moka / Café Cálido', hex: '#78350f' }
];

// Estado global en memoria
let citasCache = [];
let currentWeekOffset = 0;
let filtroDias = parseInt(localStorage.getItem('psicolau_filtro_dias')) || 7;
let terminoBusqueda = '';
let tipoRegistroActual = 'CITA'; // 'CITA' | 'EVALUACION' | 'GRUPAL' | 'BLOQUEO'
let filtroAuditoriaActual = 'SEMANA'; // 'SEMANA' | 'TODAS'

// Helper para cálculo de contraste de color
function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 145 ? '#0f172a' : '#ffffff';
}

// Helper para separar prefijo internacional y número telefónico
function parsearTelefono(telCompleto) {
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

// Obtener el siguiente color de la paleta que no se haya usado aún (o el menos usado)
function obtenerSiguienteColorDisponible() {
  const coloresDisponibles = PALETA_COLORES
    .map(c => c.hex)
    .filter(hex => hex.toLowerCase() !== '#94a3b8' && hex.toLowerCase() !== '#475569' && hex.toLowerCase() !== '#78350f');

  const frecuencias = {};
  coloresDisponibles.forEach(hex => {
    frecuencias[hex.toLowerCase()] = 0;
  });

  citasCache.forEach(cita => {
    if (cita.estado_cita !== 'CANCELADA' && cita.color) {
      const hex = cita.color.toLowerCase();
      if (frecuencias[hex] !== undefined) {
        frecuencias[hex]++;
      }
    }
  });

  const noUsado = coloresDisponibles.find(hex => frecuencias[hex.toLowerCase()] === 0);
  if (noUsado) return noUsado;

  let menorFrecuencia = Infinity;
  let colorMenosUsado = coloresDisponibles[0];

  for (const hex of coloresDisponibles) {
    const freq = frecuencias[hex.toLowerCase()] || 0;
    if (freq < menorFrecuencia) {
      menorFrecuencia = freq;
      colorMenosUsado = hex;
    }
  }

  return colorMenosUsado;
}

// Obtener datos de cobro guardados en localStorage
function getDatosPago() {
  try {
    const data = localStorage.getItem('psicolau_datos_pago');
    return data ? JSON.parse(data) : {
      banco: '',
      titular: '',
      clabe: '',
      enlace: ''
    };
  } catch (e) {
    return { banco: '', titular: '', clabe: '', enlace: '' };
  }
}

// Helper global de sanitización para prevenir XSS en renderizado dinámico
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

