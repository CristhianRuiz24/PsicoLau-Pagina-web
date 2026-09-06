// --- Lógica de Autenticación y Acceso al Panel Clínico ---

// Redirigir de inmediato si ya hay una sesión activa en localStorage
if (localStorage.getItem('psicolau_token')) {
  window.location.href = '/panel/agenda.html';
}

function inicializarLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');
    const btn = document.getElementById('loginBtn');

    errorMsg.style.display = 'none';
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i> Autenticando...';
    btn.disabled = true;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('psicolau_token', data.token);
        window.location.href = '/panel/agenda.html';
      } else {
        throw new Error(data.message || 'Credenciales inválidas');
      }
    } catch (error) {
      errorMsg.innerText = error.message || 'Error al conectar con el servidor';
      errorMsg.style.display = 'block';
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarLogin);
} else {
  inicializarLogin();
}
