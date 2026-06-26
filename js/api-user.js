/**
 * @file api-user.js
 * @description Cliente de API para autenticar usuarios, consultar el progreso persistido y enviar al backend las acciones que modifican vidas, niveles, tiempo invertido, compras y foto de perfil.
 * @module APIUsuario
 */
const API_BASE = window.API_BASE || window.location.origin;

/**
 * Ejecuta una petición HTTP al backend de LSM Gamificada y normaliza el manejo de errores JSON.
 * @param {string} path - Ruta relativa del endpoint que se invocará sobre la base de la API.
 * @param {RequestInit} options - Opciones de fetch, incluyendo método, encabezados y cuerpo de la solicitud.
 * @returns {Promise<Object>} Respuesta JSON devuelta por el backend para alimentar el estado de la interfaz.
 */
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

/**
 * Solicita la autenticación de un usuario registrado.
 * @param {string} usuario - Nombre de usuario capturado en el formulario de inicio de sesión.
 * @param {string} password - Contraseña asociada a la cuenta.
 * @returns {Promise<Object>} Estado inicial del usuario autenticado.
 */
export function loginUser(usuario, password) {
  return request("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
}

/**
 * Crea una cuenta nueva en el backend.
 * @param {string} usuario - Nombre de usuario elegido para la cuenta.
 * @param {string} password - Contraseña que se guardará para el acceso posterior.
 * @returns {Promise<Object>} Confirmación o estado inicial generado tras el registro.
 */
export function registerUser(usuario, password) {
  return request("/api/user/register", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
}

/**
 * Consulta el progreso persistido de un usuario.
 * @param {string} usuario - Identificador del usuario cuya información se necesita.
 * @returns {Promise<Object>} Estado crudo recibido desde la API de usuarios.
 */
export function fetchUserState(usuario) {
  const qs = new URLSearchParams({ usuario });
  return request(`/api/user/state?${qs.toString()}`);
}

/**
 * Descuenta vidas al usuario cuando falla una respuesta.
 * @param {string} usuario - Usuario afectado por la penalización.
 * @param {number} amount - Cantidad de vidas que deben descontarse.
 * @returns {Promise<Object>} Estado actualizado después de aplicar la pérdida de vidas.
 */
export function loseLife(usuario, amount = 1) {
  return request("/api/user/lose-life", {
    method: "POST",
    body: JSON.stringify({ usuario, amount }),
  });
}

/**
 * Notifica al backend que el usuario terminó un nivel de la ruta.
 * @param {string} usuario - Usuario que completó la lección.
 * @param {number} level - Número de nivel completado.
 * @returns {Promise<Object>} Estado actualizado con avance, experiencia y recompensas.
 */
export function completeLevel(usuario, level) {
  return request("/api/user/complete-level", {
    method: "POST",
    body: JSON.stringify({ usuario, level }),
  });
}

/**
 * Registra segundos de práctica acumulados durante una sesión de ejercicios.
 * @param {string} usuario - Usuario al que se sumará el tiempo.
 * @param {number} seconds - Duración de práctica en segundos.
 * @returns {Promise<Object>} Estado actualizado con el tiempo invertido.
 */
export function addTimeInvested(usuario, seconds) {
  return request("/api/user/time-invested", {
    method: "POST",
    body: JSON.stringify({ usuario, seconds }),
  });
}

/**
 * Compra un producto de la tienda con las gemas del usuario.
 * @param {string} usuario - Usuario que solicita la compra.
 * @param {string} productId - Identificador del producto seleccionado en la tienda.
 * @returns {Promise<Object>} Estado actualizado con gemas, vidas o poderes modificados.
 */
export function purchaseStoreItem(usuario, productId) {
  return request("/api/user/purchase", {
    method: "POST",
    body: JSON.stringify({ usuario, productId }),
  });
}

/**
 * Envía una nueva foto de perfil codificada como Data URL.
 * @param {string} usuario - Usuario dueño del perfil.
 * @param {string} dataUrl - Imagen seleccionada codificada en base64/Data URL.
 * @returns {Promise<Object>} Estado actualizado con la nueva referencia de imagen.
 */
export function updateProfilePhoto(usuario, dataUrl) {
  return request("/api/user/profile-photo", {
    method: "POST",
    body: JSON.stringify({ usuario, dataUrl }),
  });
}
