/**
 * @file game-state.js
 * @description Adapta el estado persistido del usuario a un modelo de frontend y expone operaciones globales para perder vidas, comprar recompensas y actualizar la foto de perfil usando la sesión activa.
 * @module EstadoDelJuego
 */
import { fetchUserState, loseLife, purchaseStoreItem, updateProfilePhoto } from "./api-user.js";
import { loadSession } from "./user-session.js";

/**
 * Obtiene el usuario de la sesión activa o detiene la operación si no existe autenticación.
 * @returns {string} Nombre del usuario autenticado que se usará en llamadas al backend.
 */
function getUser() {
  const session = loadSession();
  if (!session?.usuario) {
    throw new Error("No hay sesión iniciada");
  }
  return session.usuario;
}

/**
 * Carga el estado completo del jugador desde la API y lo adapta al formato usado por la interfaz.
 * @returns {Promise<Object>} Estado normalizado con vidas, gemas, avance, perfil y poderes activos.
 */
export async function loadState() {
  const usuario = getUser();
  const state = await fetchUserState(usuario);
  return normalizeState(state);
}

/**
 * Convierte los nombres y valores crudos del backend al modelo consistente del frontend.
 * @param {Object} state - Registro de estado devuelto por la API de usuarios.
 * @returns {Object} Estado normalizado para componentes de ruta, tienda, perfil y ejercicios.
 */
function normalizeState(state) {
  return {
    lives: Number(state.vidas) || 0,
    maxLives: 5,
    gems: Number(state.gemas) || 0,
    stage: Number(state.etapa) || 1,
    level: Number(state.nivel) || 1,
    createdAt: state.creado_en || null,
    profilePhotoUrl: state.foto_perfil_url || null,
    profilePhotoBase64: state.foto_perfil_base64 || null,
    experience: Number(state.experiencia) || 0,
    progress: Number(state.progreso) || 0,
    streakDays: Number(state.dias_racha) || 0,
    lessonsDone: Number(state.lecciones_terminadas) || 0,
    timeInvestedSeconds: Number(state.tiempo_invertido_segundos) || 0,
    infiniteHeartsActive: Boolean(state.corazones_ilimitados_activos),
    infiniteHeartsRemainingSeconds: Number(state.corazones_ilimitados_segundos_restantes) || 0,
    usuario: state.usuario,
  };
}

/**
 * Descuenta vidas del usuario autenticado y devuelve el estado resultante.
 * @param {number} n - Cantidad de vidas que deben retirarse.
 * @returns {Promise<Object>} Estado normalizado después de la penalización.
 */
export async function loseLifeGlobal(n = 1) {
  const usuario = getUser();
  const state = await loseLife(usuario, n);
  return normalizeState(state);
}

/**
 * Ejecuta una compra de tienda para el usuario autenticado.
 * @param {string} productId - Identificador del producto seleccionado.
 * @returns {Promise<Object>} Estado normalizado después de aplicar la compra.
 */
export async function purchaseStoreItemGlobal(productId) {
  const usuario = getUser();
  const state = await purchaseStoreItem(usuario, productId);
  return normalizeState(state);
}

/**
 * Actualiza la foto de perfil del usuario autenticado.
 * @param {string} dataUrl - Imagen codificada como Data URL lista para persistirse.
 * @returns {Promise<Object>} Estado normalizado con la foto actualizada.
 */
export async function updateProfilePhotoGlobal(dataUrl) {
  const usuario = getUser();
  const state = await updateProfilePhoto(usuario, dataUrl);
  return normalizeState(state);
}
