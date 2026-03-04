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
