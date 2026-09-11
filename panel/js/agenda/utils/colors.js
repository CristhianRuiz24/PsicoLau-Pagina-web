// panel/js/agenda/utils/colors.js
// RF-08: Gestión de colores, paleta oficial, gotero, contraste y detección de color disponible

export const PALETA_COLORES = (typeof window !== 'undefined' && window.PALETA_COLORES) ? window.PALETA_COLORES : [
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

export function getColoresPersonalizados() {
  try {
    const raw = localStorage.getItem('psicolau_colores_personalizados');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function guardarColorPersonalizado(hex) {
  if (!hex || typeof hex !== 'string') return;
  const hexNorm = hex.trim().toUpperCase();
  if (!hexNorm.startsWith('#') || (hexNorm.length !== 4 && hexNorm.length !== 7)) return;

  // Verificar si ya existe en la paleta oficial predefinida
  const yaEnPaleta = PALETA_COLORES.some(c => c.hex.toUpperCase() === hexNorm);
  if (yaEnPaleta) return;

  const guardados = getColoresPersonalizados();
  const filtrados = guardados.filter(c => c.toUpperCase() !== hexNorm);
  filtrados.unshift(hexNorm);

  // Mantener un máximo de 10 colores recientes guardados
  const maxGuardados = filtrados.slice(0, 10);
  try {
    localStorage.setItem('psicolau_colores_personalizados', JSON.stringify(maxGuardados));
  } catch (e) {
    console.warn('No se pudo guardar color personalizado en localStorage', e);
  }
}

export function renderSwatches(colorSeleccionado = '#3EB8CC') {
  const container = document.getElementById('swatchesContainer');
  if (!container) return;
  container.innerHTML = '';

  const colorSelNorm = (colorSeleccionado || '#3EB8CC').toUpperCase();
  let colorEncontrado = false;

  // 1. Renderizar los colores estándar
  PALETA_COLORES.forEach(c => {
    const swatch = document.createElement('div');
    const esActivo = c.hex.toUpperCase() === colorSelNorm;
    if (esActivo) colorEncontrado = true;

    swatch.className = `color-swatch ${esActivo ? 'active' : ''}`;
    swatch.style.backgroundColor = c.hex;
    swatch.title = `${c.nombre} (${c.hex})`;

    swatch.onclick = () => {
      document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const inputColor = document.getElementById('nc_color');
      if (inputColor) inputColor.value = c.hex;
      const cp = document.getElementById('customColorPicker');
      if (cp) cp.value = c.hex;
    };
    container.appendChild(swatch);
  });

  // 2. Renderizar los colores personalizados guardados
  const personalizados = getColoresPersonalizados();
  personalizados.forEach(hex => {
    const swatch = document.createElement('div');
    const esActivo = hex.toUpperCase() === colorSelNorm;
    if (esActivo) colorEncontrado = true;

    swatch.className = `color-swatch custom-saved-swatch ${esActivo ? 'active' : ''}`;
    swatch.style.backgroundColor = hex;
    swatch.title = `Color personalizado guardado (${hex})`;

    swatch.onclick = () => {
      document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const inputColor = document.getElementById('nc_color');
      if (inputColor) inputColor.value = hex;
      const cp = document.getElementById('customColorPicker');
      if (cp) cp.value = hex;
    };
    container.appendChild(swatch);
  });

  // 3. Selector de Color Personalizado (Gotero / Paleta Libre)
  const customWrapper = document.createElement('div');
  customWrapper.className = `color-swatch-custom ${!colorEncontrado ? 'active' : ''}`;
  customWrapper.title = 'Elegir color personalizado con gotero...';

  const customPicker = document.createElement('input');
  customPicker.type = 'color';
  customPicker.id = 'customColorPicker';
  customPicker.value = colorSeleccionado.startsWith('#') ? colorSeleccionado : '#3EB8CC';
  customPicker.className = 'custom-color-input';

  const iconPalette = document.createElement('i');
  iconPalette.className = 'fa-solid fa-eye-dropper';

  customWrapper.appendChild(customPicker);
  customWrapper.appendChild(iconPalette);

  // Vista previa al arrastrar el cursor en la paleta
  customPicker.oninput = (e) => {
    const customHex = e.target.value;
    document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
    customWrapper.classList.add('active');
    const inputColor = document.getElementById('nc_color');
    if (inputColor) inputColor.value = customHex;
  };

  // Guardado persistente inmediato al seleccionar el color
  customPicker.onchange = (e) => {
    const customHex = e.target.value;
    guardarColorPersonalizado(customHex);
    renderSwatches(customHex);
  };

  container.appendChild(customWrapper);
}

export function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 145 ? '#0f172a' : '#ffffff';
}

export function obtenerSiguienteColorDisponible() {
  const coloresDisponibles = PALETA_COLORES
    .map(c => c.hex)
    .filter(hex => hex.toLowerCase() !== '#94a3b8' && hex.toLowerCase() !== '#475569' && hex.toLowerCase() !== '#78350f');

  const frecuencias = {};
  coloresDisponibles.forEach(hex => {
    frecuencias[hex.toLowerCase()] = 0;
  });

  const cache = (typeof window !== 'undefined' && window.citasCache) ? window.citasCache : [];
  cache.forEach(cita => {
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

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.getColoresPersonalizados = getColoresPersonalizados;
  window.guardarColorPersonalizado = guardarColorPersonalizado;
  window.renderSwatches = renderSwatches;
  window.getContrastColor = getContrastColor;
  window.obtenerSiguienteColorDisponible = obtenerSiguienteColorDisponible;
}
