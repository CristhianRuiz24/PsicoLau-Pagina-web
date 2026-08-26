// --- Módulo de Audio y Efectos Sonoros (Web Audio API) ---

// Reproducción de sonido armónico y satisfactorio usando Web Audio API nativa
function reproducirSonidoCompletada() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const t = ctx.currentTime;

    // Nota 1: Mi agudo (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, t);
    gain1.gain.setValueAtTime(0.18, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.3);

    // Nota 2: Si brillante (B5 - 987.77 Hz - armónico de campana)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, t + 0.08);
    gain2.gain.setValueAtTime(0.24, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.55);
  } catch (err) {
    console.warn('Audio no disponible:', err);
  }
}
