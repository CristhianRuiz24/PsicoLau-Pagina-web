// panel/js/agenda/utils/modalLoader.js
// RF-17: Carga bajo demanda (fetch lazy-load) de modales HTML desde /panel/partials/modals/

const modalesCargados = new Set();

/**
 * Asegura que el partial HTML de un modal esté inyectado en el DOM antes de manipularlo o mostrarlo.
 * @param {string} modalId - El ID del elemento modal en el DOM (ej: 'modalNuevaCita')
 * @param {string} partialPath - Ruta al partial HTML (ej: '/panel/partials/modals/modal-nueva-cita.html')
 * @returns {Promise<HTMLElement>} Elemento del modal en el DOM
 */
export async function asegurarModal(modalId, partialPath) {
  let modalEl = document.getElementById(modalId);
  if (modalEl) return modalEl;

  try {
    const res = await fetch(partialPath);
    if (!res.ok) {
      throw new Error(`Error al obtener partial ${partialPath}: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();

    let container = document.getElementById('modalsContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modalsContainer';
      document.body.appendChild(container);
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();

    // El elemento modal puede ser el div con id igual a modalId o el primer element child
    const el = tempDiv.querySelector(`#${modalId}`) || tempDiv.firstElementChild;
    if (el) {
      container.appendChild(el);
      modalesCargados.add(modalId);
      return el;
    } else {
      // Si por alguna razón hay comentarios u otros nodos
      while (tempDiv.firstChild) {
        container.appendChild(tempDiv.firstChild);
      }
      return document.getElementById(modalId);
    }
  } catch (err) {
    console.error(`[asegurarModal] No se pudo cargar el modal '${modalId}' desde '${partialPath}':`, err);
    throw err;
  }
}

if (typeof window !== 'undefined') {
  window.asegurarModal = asegurarModal;
}
