/*
 * Nombre: api-user.js
 * Descripción: Contiene estilos o lógica de soporte para api-user.
 * Módulo: Proyecto LSM Gamificada
 */
const API_BASE = window.API_BASE || window.location.origin;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  return res.json();
}

export function loginUser(usuario, password) {
  return request("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
}

export function registerUser(usuario, password) {
  return request("/api/user/register", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
}

export function fetchUserState(usuario) {
  const qs = new URLSearchParams({ usuario });
  return request(`/api/user/state?${qs.toString()}`);
}

export function loseLife(usuario, amount = 1) {
  return request("/api/user/lose-life", {
    method: "POST",
    body: JSON.stringify({ usuario, amount }),
  });
}

export function completeLevel(usuario, level) {
  return request("/api/user/complete-level", {
    method: "POST",
    body: JSON.stringify({ usuario, level }),
  });
}

export function addTimeInvested(usuario, seconds) {
  return request("/api/user/time-invested", {
    method: "POST",
    body: JSON.stringify({ usuario, seconds }),
  });
}

export function purchaseStoreItem(usuario, productId) {
  return request("/api/user/purchase", {
    method: "POST",
    body: JSON.stringify({ usuario, productId }),
  });
}

export function updateProfilePhoto(usuario, dataUrl) {
  return request("/api/user/profile-photo", {
    method: "POST",
    body: JSON.stringify({ usuario, dataUrl }),
  });
}
