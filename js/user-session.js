/**
 * @file user-session.js
 * @description Persiste, recupera y elimina la sesión ligera del usuario en sessionStorage para proteger el acceso a las vistas autenticadas.
 * @module Autenticación
 */
const SESSION_KEY = "lsmquest_user_session";

/**
 * Guarda en sessionStorage la identidad mínima del usuario autenticado.
 * @param {Object} user - Datos de sesión, normalmente con la propiedad usuario.
 * @returns {void} No devuelve valor; persiste la sesión en el navegador.
 */
export function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Recupera la sesión del navegador y tolera datos corruptos o ausentes.
 * @returns {Object|null} Objeto de sesión si existe y es válido; de lo contrario null.
 */
export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Elimina la sesión local para cerrar el acceso del usuario.
 * @returns {void} No devuelve valor; borra la clave de sesión.
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
