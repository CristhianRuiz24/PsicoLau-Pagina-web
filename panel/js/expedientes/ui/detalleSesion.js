// panel/js/expedientes/ui/detalleSesion.js
// RF-14: Vista cómoda y ampliada de sesión individual, edición in-situ, impresión PDF y descarga .txt

import { getAuthHeaders, getApiUrl } from '../utils/api.js';
import { escapeHtmlText, renderListaNotasExpediente } from '../render/notasList.js';
import { getPacienteActivoExpediente, getNotasCacheExpediente } from '../paciente.js';
import { asegurarModal } from '../../agenda/utils/modalLoader.js';

let notaActivaDetalleId = null;
let esDetalleMaximizado = false;
let esModoEdicionDetalle = false;

export async function abrirDetalleSesion(notaId) {
  const notas = getNotasCacheExpediente();
  const paciente = getPacienteActivoExpediente();
  if (!notas || !paciente) return;

  const nota = notas.find(n => n.id === notaId);
  if (!nota) return;

  await asegurarModal('modalDetalleSesionExpediente', '/panel/partials/modals/modal-detalle-sesion.html');

  notaActivaDetalleId = notaId;
  esModoEdicionDetalle = false;
  const index = notas.findIndex(n => n.id === notaId);
  const sesionNumero = notas.length - index;

  const modal = document.getElementById('modalDetalleSesionExpediente');
  const badgeNum = document.getElementById('detalleSesionBadgeNum');
  const fechaEl = document.getElementById('detalleSesionFecha');
  const pacienteEl = document.getElementById('detalleSesionPaciente');
  const contenido = document.getElementById('detalleSesionContenido');

  const d = new Date(nota.fechaSesion);
  const fechaTxt = d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaCap = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);

  if (badgeNum) badgeNum.innerText = `Sesión #${sesionNumero}`;
  if (fechaEl) fechaEl.innerText = fechaCap;
  if (pacienteEl) pacienteEl.innerHTML = `<i class="fa-solid fa-user-check" style="margin-right: 4px;"></i> Paciente: <strong>${escapeHtmlText(paciente.nombre)}</strong>`;

  actualizarBotonesBarraDetalle(false);

  let html = `
    <div style="display: flex; flex-direction: column; gap: 1.2rem; padding: 0.5rem 0;">
  `;

  if (nota.resumenBreve) {
    html += `
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 10px 10px 0; padding: 1.1rem 1.4rem; box-shadow: 0 2px 8px rgba(34,197,94,0.08);">
        <div style="font-size: 0.85rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem;">
          <i class="fa-solid fa-quote-left" style="margin-right: 4px;"></i> Resumen Principal de la Sesión
        </div>
        <div style="font-size: 1.1rem; color: #14532d; font-weight: 600; line-height: 1.5; white-space: pre-line;">
          ${escapeHtmlText(nota.resumenBreve)}
        </div>
      </div>
    `;
  }

  html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.2rem;">`;

  const campos = [
    { key: 'estadoActual', label: '1. Estado Actual / Motivo de Consulta', icon: 'fa-heart-pulse', color: '#ec4899', bg: '#fdf2f8' },
    { key: 'insightPaciente', label: '2. Insight del Paciente', icon: 'fa-lightbulb', color: '#eab308', bg: '#fefce8' },
    { key: 'eventoPrincipal', label: '3. Evento Principal / Relevante', icon: 'fa-star', color: '#f97316', bg: '#fff7ed' },
    { key: 'intervenciones', label: '4. Intervenciones Clínicas Realizadas', icon: 'fa-hand-holding-medical', color: '#0284c7', bg: '#f0f9ff' },
    { key: 'formulacionClinica', label: '5. Formulación Clínica en Evolución', icon: 'fa-brain', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'tareasAsignadas', label: '6. Tareas y Acuerdos Asignados', icon: 'fa-list-check', color: '#10b981', bg: '#ecfdf5' },
    { key: 'pendientesProximaSesion', label: '7. Pendientes para Próxima Sesión', icon: 'fa-clipboard-question', color: '#ea580c', bg: '#fff7ed' }
  ];

  campos.forEach(c => {
    const valor = nota[c.key];
    if (valor) {
      html += `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9;">
            <div style="width: 28px; height: 28px; border-radius: 6px; background: ${c.bg}; color: ${c.color}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
              <i class="fa-solid ${c.icon}"></i>
            </div>
            <span style="font-size: 0.88rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px;">
              ${c.label}
            </span>
          </div>
          <div style="font-size: 0.98rem; color: #334155; line-height: 1.6; white-space: pre-line; padding-left: 2px;">
            ${escapeHtmlText(valor)}
          </div>
        </div>
      `;
    }
  });

  html += `
      </div>
      <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem; text-align: right;">
        Nota registrada el ${new Date(nota.creadoEn).toLocaleDateString('es-MX')} · Cifrado AES-256-GCM
      </div>
    </div>
  `;

  if (contenido) contenido.innerHTML = html;
  if (modal) modal.style.display = 'flex';
}

export function actualizarBotonesBarraDetalle(modoEdicion) {
  const container = document.getElementById('detalleSesionAccionesTop');
  if (!container) return;

  if (modoEdicion) {
    container.innerHTML = `
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 1.1rem; font-size: 0.86rem; background: var(--turquesa); color: white; font-weight: 700;" onclick="guardarEdicionInSituDetalle(event)" id="btnGuardarDetalleInSitu">
        <i class="fa-solid fa-floppy-disk" style="margin-right: 4px;"></i> Guardar Cambios
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.86rem; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;" onclick="cancelarEdicionInSituDetalle()">
        <i class="fa-solid fa-xmark" style="margin-right: 4px;"></i> Cancelar
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.85rem; font-size: 0.85rem; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;" onclick="toggleAgrandarDetalleSesion()" title="Agrandar o reducir tamaño">
        <i class="fa-solid fa-expand" id="iconAgrandarDetalle"></i>
      </button>
    `;
  } else {
    container.innerHTML = `
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.85rem; background: #0284c7; color: white;" onclick="imprimirNotaActualDetalle()" title="Imprimir o guardar en PDF únicamente esta sesión">
        <i class="fa-solid fa-file-pdf" style="margin-right: 4px;"></i> Imprimir PDF
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.85rem; background: #475569; color: white;" onclick="descargarNotaActualTxt()" title="Descargar nota en archivo de texto (.txt)">
        <i class="fa-solid fa-file-lines" style="margin-right: 4px;"></i> Guardar .txt
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.85rem; background: #f8fafc; color: var(--texto-oscuro); border: 1px solid #cbd5e1;" onclick="editarNotaDesdeDetalle()" title="Editar nota clínica en esta misma vista">
        <i class="fa-solid fa-pen-to-square" style="color: var(--turquesa); margin-right: 4px;"></i> Editar
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.85rem; font-size: 0.85rem; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;" onclick="toggleAgrandarDetalleSesion()" title="Agrandar o reducir tamaño">
        <i class="fa-solid fa-expand" id="iconAgrandarDetalle"></i>
      </button>
      <button type="button" class="btn-close-modal" onclick="cerrarDetalleSesion()" title="Cerrar vista">&times;</button>
    `;
  }
}

export function editarNotaDesdeDetalle() {
  const notas = getNotasCacheExpediente();
  if (!notaActivaDetalleId || !notas) return;

  const nota = notas.find(n => n.id === notaActivaDetalleId);
  if (!nota) return;

  esModoEdicionDetalle = true;
  actualizarBotonesBarraDetalle(true);

  const contenido = document.getElementById('detalleSesionContenido');
  const d = new Date(nota.fechaSesion);
  const fechaIso = d.toISOString().split('T')[0];

  let html = `
    <form id="formEdicionInSituDetalle" onsubmit="guardarEdicionInSituDetalle(event)" style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0;">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem;">
        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">
            <i class="fa-regular fa-calendar" style="color: var(--turquesa);"></i> Fecha de la Sesión:
          </label>
          <input type="date" id="insitu_fechaSesion" value="${fechaIso}" required style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-quote-left" style="color: var(--turquesa);"></i> Resumen Breve / Título Clínico:
          </label>
          <input type="text" id="insitu_resumenBreve" value="${escapeHtmlText(nota.resumenBreve || '')}" placeholder="Resumen clave de la sesión..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1rem;">
        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #ec4899; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-heart-pulse"></i> 1. Estado Actual / Motivo de Consulta:
          </label>
          <textarea id="insitu_estadoActual" rows="4" placeholder="Síntomas, afecto, regulación emocional..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.estadoActual || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #b45309; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-lightbulb"></i> 2. Insight del Paciente:
          </label>
          <textarea id="insitu_insightPaciente" rows="4" placeholder="Comprensión, tomas de conciencia del paciente..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.insightPaciente || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #c2410c; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-star"></i> 3. Evento Principal / Relevante:
          </label>
          <textarea id="insitu_eventoPrincipal" rows="4" placeholder="Lo más relevante ocurrido en la semana o sesión..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.eventoPrincipal || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0284c7; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-hand-holding-medical"></i> 4. Intervenciones Clínicas Realizadas:
          </label>
          <textarea id="insitu_intervenciones" rows="4" placeholder="Técnicas aplicadas, psicoeducación, reestructuración..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.intervenciones || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #7c3aed; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-brain"></i> 5. Formulación Clínica en Evolución:
          </label>
          <textarea id="insitu_formulacionClinica" rows="4" placeholder="Hipótesis de trabajo, patrones identificados..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.formulacionClinica || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #15803d; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-list-check"></i> 6. Tareas y Acuerdos Asignados:
          </label>
          <textarea id="insitu_tareasAsignadas" rows="4" placeholder="Ejercicios entre sesiones, registros, compromisos..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.tareasAsignadas || '')}</textarea>
        </div>

        <div style="grid-column: 1 / -1;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #9a3412; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-clipboard-question"></i> 7. Pendientes para Próxima Sesión:
          </label>
          <textarea id="insitu_pendientesProximaSesion" rows="3" placeholder="Puntos a retomar o evaluar en la siguiente cita..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.pendientesProximaSesion || '')}</textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.6rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; margin-top: 0.5rem;">
        <button type="button" class="btn" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; width: auto; padding: 0.6rem 1.2rem;" onclick="cancelarEdicionInSituDetalle()">Cancelar</button>
        <button type="submit" class="btn" style="background: var(--turquesa); color: white; width: auto; padding: 0.6rem 1.6rem; font-weight: 700;" id="btnGuardarDetalleInSituSubmit">
          <i class="fa-solid fa-floppy-disk" style="margin-right: 4px;"></i> Guardar Cambios
        </button>
      </div>
    </form>
  `;

  if (contenido) {
    contenido.innerHTML = html;
    contenido.scrollTop = 0;
  }
}

export async function guardarEdicionInSituDetalle(event) {
  if (event) event.preventDefault();
  const paciente = getPacienteActivoExpediente();
  const notas = getNotasCacheExpediente();
  if (!notaActivaDetalleId || !paciente) return;

  const btnSubmit = document.getElementById('btnGuardarDetalleInSituSubmit') || document.getElementById('btnGuardarDetalleInSitu');
  const txtOriginal = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
  }

  const payload = {
    fechaSesion: document.getElementById('insitu_fechaSesion').value,
    resumenBreve: (document.getElementById('insitu_resumenBreve')?.value || '').trim(),
    estadoActual: (document.getElementById('insitu_estadoActual')?.value || '').trim(),
    insightPaciente: (document.getElementById('insitu_insightPaciente')?.value || '').trim(),
    eventoPrincipal: (document.getElementById('insitu_eventoPrincipal')?.value || '').trim(),
    intervenciones: (document.getElementById('insitu_intervenciones')?.value || '').trim(),
    formulacionClinica: (document.getElementById('insitu_formulacionClinica')?.value || '').trim(),
    tareasAsignadas: (document.getElementById('insitu_tareasAsignadas')?.value || '').trim(),
    pendientesProximaSesion: (document.getElementById('insitu_pendientesProximaSesion')?.value || '').trim()
  };

  try {
    const res = await fetch(`${getApiUrl()}/expediente/${notaActivaDetalleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      const index = notas.findIndex(n => n.id === notaActivaDetalleId);
      if (index !== -1) {
        notas[index] = data.data;
      }
      renderListaNotasExpediente(notas);
      abrirDetalleSesion(notaActivaDetalleId);
    } else {
      alert(data.message || 'Error al guardar la nota clínica');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = txtOriginal;
      }
    }
  } catch (error) {
    console.error('Error al guardar edición in situ:', error);
    alert('Error de conexión al guardar nota clínica');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = txtOriginal;
    }
  }
}

export function cancelarEdicionInSituDetalle() {
  if (notaActivaDetalleId) {
    abrirDetalleSesion(notaActivaDetalleId);
  }
}

export function cerrarDetalleSesion() {
  const modal = document.getElementById('modalDetalleSesionExpediente');
  if (modal) modal.style.display = 'none';
  notaActivaDetalleId = null;
  esModoEdicionDetalle = false;
}

export function toggleAgrandarDetalleSesion() {
  const dialogo = document.getElementById('dialogoDetalleSesion');
  const icono = document.getElementById('iconAgrandarDetalle');
  esDetalleMaximizado = !esDetalleMaximizado;

  if (dialogo) {
    if (esDetalleMaximizado) {
      dialogo.style.maxWidth = '98vw';
      dialogo.style.height = '96vh';
      dialogo.style.maxHeight = '96vh';
      if (icono) icono.className = 'fa-solid fa-compress';
    } else {
      dialogo.style.maxWidth = '960px';
      dialogo.style.height = 'auto';
      dialogo.style.maxHeight = '94vh';
      if (icono) icono.className = 'fa-solid fa-expand';
    }
  }
}

export function generarHtmlNotaIndividualImprimible(p, nota, sesionNumero, fechaHoy) {
  const d = new Date(nota.fechaSesion);
  const fechaTxt = d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaCap = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Nota de Sesión #${sesionNumero} — ${escapeHtmlText(p.nombre)} — PsicoLau</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: letter portrait;
          margin: 8mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background: #ffffff;
          line-height: 1.35;
          font-size: 9pt;
          margin: 0;
          padding: 0;
        }
        .header-membrete {
          border-bottom: 2px solid #EC5E86;
          padding-bottom: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .brand-title {
          color: #EC5E86;
          font-size: 16pt;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .brand-sub {
          color: #3EB8CC;
          font-size: 9.5pt;
          font-weight: 600;
          margin: 1px 0 0 0;
        }
        .brand-prof {
          color: #64748b;
          font-size: 8.5pt;
          margin: 1px 0 0 0;
        }
        .paciente-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 10px;
          margin-bottom: 8px;
        }
        .paciente-grid {
          display: grid;
          grid-template-columns: 1.4fr 1.3fr 0.9fr;
          gap: 6px;
          font-size: 9pt;
        }
        .paciente-grid strong {
          color: #334155;
        }
        .sesion-num-badge {
          background: #EC5E86;
          color: #ffffff;
          font-size: 8pt;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .resumen-box {
          background: #f0fdf4;
          border-left: 3px solid #22c55e;
          padding: 6px 10px;
          font-size: 9pt;
          color: #166534;
          margin-bottom: 8px;
          border-radius: 0 4px 4px 0;
        }
        .campo-doc {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 5px 8px;
          margin-bottom: 6px;
          page-break-inside: avoid;
        }
        .campo-doc strong {
          color: #0f172a;
          display: block;
          margin-bottom: 2px;
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .campo-doc p {
          margin: 0;
          color: #334155;
          white-space: pre-line;
          font-size: 8.8pt;
        }
        .firma-area {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
          page-break-inside: avoid;
        }
        .firma-box {
          border-top: 1px solid #94a3b8;
          width: 240px;
          text-align: center;
          padding-top: 4px;
          font-size: 8.5pt;
          color: #334155;
        }
        .footer-confidencial {
          margin-top: 8px;
          border-top: 1px solid #cbd5e1;
          padding-top: 4px;
          font-size: 7.5pt;
          color: #94a3b8;
          text-align: center;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header-membrete">
        <div>
          <h1 class="brand-title">PSICOLAU</h1>
          <p class="brand-sub">Psicología Clínica y Resiliencia</p>
          <p class="brand-prof">Ana Laura Gómez Díaz · Psicoterapia y Neuropsicología</p>
        </div>
        <div style="text-align: right; font-size: 8.5pt; color: #64748b;">
          <div><strong>NOTA CLÍNICA INDIVIDUAL</strong></div>
          <div>Fecha de emisión: ${fechaHoy}</div>
          <div>Dominio: psicolau.com</div>
        </div>
      </div>

      <div class="paciente-box">
        <div class="paciente-grid">
          <div><strong>Paciente:</strong> ${escapeHtmlText(p.nombre)}</div>
          <div><strong>Fecha de Sesión:</strong> ${fechaCap}</div>
          <div><strong>Sesión:</strong> <span class="sesion-num-badge">Sesión #${sesionNumero}</span></div>
        </div>
      </div>

      ${nota.resumenBreve ? `
        <div class="resumen-box">
          <strong style="display: block; margin-bottom: 1px;">Resumen Clínico:</strong>
          ${escapeHtmlText(nota.resumenBreve)}
        </div>
      ` : ''}

      ${nota.estadoActual ? `
        <div class="campo-doc">
          <strong style="color: #ec4899;">1. Estado Actual / Motivo de Consulta:</strong>
          <p>${escapeHtmlText(nota.estadoActual)}</p>
        </div>
      ` : ''}

      ${nota.insightPaciente ? `
        <div class="campo-doc">
          <strong style="color: #b45309;">2. Insight del Paciente:</strong>
          <p>${escapeHtmlText(nota.insightPaciente)}</p>
        </div>
      ` : ''}

      ${nota.eventoPrincipal ? `
        <div class="campo-doc">
          <strong style="color: #c2410c;">3. Evento Principal / Relevante:</strong>
          <p>${escapeHtmlText(nota.eventoPrincipal)}</p>
        </div>
      ` : ''}

      ${nota.intervenciones ? `
        <div class="campo-doc">
          <strong style="color: #0284c7;">4. Intervenciones Clínicas Realizadas:</strong>
          <p>${escapeHtmlText(nota.intervenciones)}</p>
        </div>
      ` : ''}

      ${nota.formulacionClinica ? `
        <div class="campo-doc">
          <strong style="color: #7c3aed;">5. Formulación Clínica en Evolución:</strong>
          <p>${escapeHtmlText(nota.formulacionClinica)}</p>
        </div>
      ` : ''}

      ${nota.tareasAsignadas ? `
        <div class="campo-doc">
          <strong style="color: #15803d;">6. Tareas y Acuerdos Asignados:</strong>
          <p>${escapeHtmlText(nota.tareasAsignadas)}</p>
        </div>
      ` : ''}

      ${nota.pendientesProximaSesion ? `
        <div class="campo-doc">
          <strong style="color: #9a3412;">7. Pendientes para Próxima Sesión:</strong>
          <p>${escapeHtmlText(nota.pendientesProximaSesion)}</p>
        </div>
      ` : ''}

      <div class="firma-area">
        <div class="firma-box">
          <strong>Psic. Ana Laura Gómez Díaz</strong><br>
          Psicóloga Clínica y Neuropsicóloga
        </div>
      </div>

      <div class="footer-confidencial">
        Documento médico confidencial emitido bajo secreto profesional deontológico.
        <br>© PsicoLau — psicolau.com
      </div>
    </body>
    </html>
  `;
}

export function imprimirNotaIndividual(notaId) {
  const paciente = getPacienteActivoExpediente();
  const notas = getNotasCacheExpediente();
  if (!paciente || !notas) return;

  const nota = notas.find(n => n.id === notaId);
  if (!nota) return;

  const index = notas.findIndex(n => n.id === notaId);
  const sesionNumero = notas.length - index;
  const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  const htmlDoc = generarHtmlNotaIndividualImprimible(paciente, nota, sesionNumero, fechaHoy);

  let iframe = document.getElementById('iframeImpresionExpediente');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'iframeImpresionExpediente';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlDoc);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 350);
}

export function imprimirNotaActualDetalle() {
  if (notaActivaDetalleId) {
    imprimirNotaIndividual(notaActivaDetalleId);
  }
}

export function descargarNotaIndividualTxt(notaId) {
  const paciente = getPacienteActivoExpediente();
  const notas = getNotasCacheExpediente();
  if (!paciente || !notas) return;

  const nota = notas.find(n => n.id === notaId);
  if (!nota) return;

  const index = notas.findIndex(n => n.id === notaId);
  const sesionNumero = notas.length - index;
  const p = paciente;
  const d = new Date(nota.fechaSesion);
  const fechaTxt = d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  let txt = `=======================================================\n`;
  txt += `PSICOLAU — NOTA CLÍNICA DE SESIÓN #${sesionNumero}\n`;
  txt += `Psicología Clínica y Neuropsicología · Ana Laura Gómez Díaz\n`;
  txt += `Dominio: psicolau.com | Fecha de emisión: ${fechaHoy}\n`;
  txt += `=======================================================\n\n`;
  txt += `DATOS DEL PACIENTE:\n`;
  txt += `• Paciente: ${p.nombre}\n`;
  txt += `• Teléfono: ${p.telefono || 'No registrado'}\n`;
  txt += `• Fecha de Sesión: ${fechaTxt.toUpperCase()}\n`;
  txt += `• Número de Sesión: Sesión #${sesionNumero}\n\n`;
  txt += `=======================================================\n`;
  txt += `CONTENIDO DE LA SESIÓN:\n`;
  txt += `=======================================================\n\n`;

  if (nota.resumenBreve) txt += `RESUMEN CLÍNICO:\n${nota.resumenBreve}\n\n`;
  if (nota.estadoActual) txt += `1. ESTADO ACTUAL / MOTIVO DE CONSULTA:\n${nota.estadoActual}\n\n`;
  if (nota.insightPaciente) txt += `2. INSIGHT DEL PACIENTE:\n${nota.insightPaciente}\n\n`;
  if (nota.eventoPrincipal) txt += `3. EVENTO PRINCIPAL / RELEVANTE:\n${nota.eventoPrincipal}\n\n`;
  if (nota.intervenciones) txt += `4. INTERVENCIONES CLÍNICAS REALIZADAS:\n${nota.intervenciones}\n\n`;
  if (nota.formulacionClinica) txt += `5. FORMULACIÓN CLÍNICA EN EVOLUCIÓN:\n${nota.formulacionClinica}\n\n`;
  if (nota.tareasAsignadas) txt += `6. TAREAS Y ACUERDOS ASIGNADOS:\n${nota.tareasAsignadas}\n\n`;
  if (nota.pendientesProximaSesion) txt += `7. PENDIENTES PRÓXIMA SESIÓN:\n${nota.pendientesProximaSesion}\n\n`;

  txt += `=======================================================\n`;
  txt += `Documento médico confidencial emitido bajo secreto profesional.\n`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const nombreSanitizado = (p.nombre || 'paciente').replace(/\s+/g, '_').toLowerCase();
  const fechaIso = d.toISOString().split('T')[0];
  link.download = `Nota_Sesion_${sesionNumero}_${nombreSanitizado}_${fechaIso}.txt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function descargarNotaActualTxt() {
  if (notaActivaDetalleId) {
    descargarNotaIndividualTxt(notaActivaDetalleId);
  }
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.abrirDetalleSesion = abrirDetalleSesion;
  window.actualizarBotonesBarraDetalle = actualizarBotonesBarraDetalle;
  window.editarNotaDesdeDetalle = editarNotaDesdeDetalle;
  window.guardarEdicionInSituDetalle = guardarEdicionInSituDetalle;
  window.cancelarEdicionInSituDetalle = cancelarEdicionInSituDetalle;
  window.cerrarDetalleSesion = cerrarDetalleSesion;
  window.toggleAgrandarDetalleSesion = toggleAgrandarDetalleSesion;
  window.imprimirNotaIndividual = imprimirNotaIndividual;
  window.imprimirNotaActualDetalle = imprimirNotaActualDetalle;
  window.descargarNotaIndividualTxt = descargarNotaIndividualTxt;
  window.descargarNotaActualTxt = descargarNotaActualTxt;
}
