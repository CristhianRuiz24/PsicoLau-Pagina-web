// panel/js/agenda/ui/notasSemana.js
// RF-07: Bloc de notas semanal del consultorio, persistencia en localStorage y auto-guardado

import { asegurarModal } from '../utils/modalLoader.js';

export function cargarNotasConsultorio() {
  const guardado = localStorage.getItem('psicolau_notas_semana') || '';
  const textarea = document.getElementById('textoNotasConsultorio');
  if (textarea) textarea.value = guardado;
}

export function guardarNotasConsultorio(texto) {
  localStorage.setItem('psicolau_notas_semana', texto);
  const label = document.getElementById('labelNotasGuardadas');
  if (label) {
    label.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
    setTimeout(() => {
      label.innerHTML = '<i class="fa-solid fa-check"></i> Guardado automáticamente';
    }, 1500);
  }
}

export async function toggleNotasSemana() {
  await asegurarModal('modalNotasSemana', '/panel/partials/modals/modal-notas-semana.html');
  const modal = document.getElementById('modalNotasSemana');
  if (modal) {
    const isShowing = modal.style.display === 'flex';
    if (!isShowing) {
      cargarNotasConsultorio();
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  }
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.toggleNotasSemana = toggleNotasSemana;
  window.cargarNotasConsultorio = cargarNotasConsultorio;
  window.guardarNotasConsultorio = guardarNotasConsultorio;
}
