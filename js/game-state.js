import { fetchUserState, loseLife, purchaseStoreItem, updateProfilePhoto } from "./api-user.js";
import { loadSession } from "./user-session.js";

function getUser() {
  const session = loadSession();
  if (!session?.usuario) {
    throw new Error("No hay sesión iniciada");
  }
  return session.usuario;
}

export async function loadState() {
  const usuario = getUser();
  const state = await fetchUserState(usuario);
  return normalizeState(state);
}

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

export async function loseLifeGlobal(n = 1) {
  const usuario = getUser();
  const state = await loseLife(usuario, n);
  return normalizeState(state);
}

export async function purchaseStoreItemGlobal(productId) {
  const usuario = getUser();
  const state = await purchaseStoreItem(usuario, productId);
  return normalizeState(state);
}

export async function updateProfilePhotoGlobal(dataUrl) {
  const usuario = getUser();
  const state = await updateProfilePhoto(usuario, dataUrl);
  return normalizeState(state);
}
