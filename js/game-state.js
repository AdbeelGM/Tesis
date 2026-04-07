import { fetchUserState, loseLife, purchaseStoreItem, updateUserProfile } from "./api-user.js";
import { loadSession } from "./user-session.js";

function getUser() {
  const session = loadSession();
  if (!session?.usuario) {
    throw new Error("No hay sesión iniciada");
  }
  return session.usuario;
}

function normalizeState(state) {
  return {
    lives: Number(state.vidas) || 0,
    maxLives: 5,
    gems: Number(state.gemas) || 0,
    stage: Number(state.etapa) || 1,
    level: Number(state.nivel) || 1,
    infiniteHeartsActive: Boolean(state.corazones_ilimitados_activos),
    infiniteHeartsRemainingSeconds: Number(state.corazones_ilimitados_segundos_restantes) || 0,
    usuario: state.usuario,
    creadoEn: state.creado_en || null,
    fotoPerfilUrl: state.foto_perfil_url || null,
    fotoPerfilBase64: state.foto_perfil_base64 || null,
    fotoPerfilMime: state.foto_perfil_mime || null,
    experiencia: Number(state.experiencia) || 0,
    progreso: Number(state.progreso) || 0,
    diasRacha: Number(state.dias_racha) || 0,
    leccionesTerminadas: Number(state.lecciones_terminadas) || 0,
    tiempoInvertidoSegundos: Number(state.tiempo_invertido_segundos) || 0,
  };
}

export async function loadState() {
  const usuario = getUser();
  const state = await fetchUserState(usuario);
  return normalizeState(state);
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

export async function updateProfileGlobal(payload = {}) {
  const usuario = getUser();
  const state = await updateUserProfile(usuario, payload);
  return normalizeState(state);
}
