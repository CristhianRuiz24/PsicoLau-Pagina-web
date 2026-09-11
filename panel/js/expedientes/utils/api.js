// panel/js/expedientes/utils/api.js
// RF-15: Encapsulación de autenticación y helpers fetch para el módulo de expedientes

export function getAuthHeaders() {
  const token = localStorage.getItem('psicolau_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export function getApiUrl() {
  if (typeof window !== 'undefined' && window.API_URL) {
    return window.API_URL;
  }
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    /^192\.168\./.test(window.location.hostname) ||
    /^10\./.test(window.location.hostname)
  );
  if (isLocal) {
    return `http://${window.location.hostname || 'localhost'}:3001/api`;
  }
  return (typeof window !== 'undefined' && window.PSICOLAU_API_URL) || 'https://api.psicolau.com/api';
}

export async function fetchWithAuth(endpoint, options = {}) {
  const url = `${getApiUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  const response = await fetch(url, {
    ...options,
    headers
  });
  return response;
}

if (typeof window !== 'undefined') {
  window.getAuthHeaders = getAuthHeaders;
}
