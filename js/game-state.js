import { fetchUserState, loseLife, purchaseStoreItem } from "./api-user.js";
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
  return {
    lives: Number(state.vidas) || 0,
    maxLives: 5,
    gems: Number(state.gemas) || 0,
    stage: Number(state.etapa) || 1,
    level: Number(state.nivel) || 1,
    infiniteHeartsActive: Boolean(state.corazones_ilimitados_activos),
    infiniteHeartsRemainingSeconds: Number(state.corazones_ilimitados_segundos_restantes) || 0,
    usuario: state.usuario,
    joinedAt: state.creado_en || null,
    profilePhotoUrl: state.foto_perfil_base64 || state.foto_perfil_url || null,
    experience: Number(state.experiencia) || 0,
    progress: Number(state.progreso) || 0,
    streakDays: Number(state.dias_racha) || 0,
    lessonsCompleted: Number(state.lecciones_terminadas) || 0,
    timeInvestedSeconds: Number(state.tiempo_invertido_segundos) || 0,
  };
}

export async function loseLifeGlobal(n = 1) {
  const usuario = getUser();
  const state = await loseLife(usuario, n);
  return {
    lives: Number(state.vidas) || 0,
    maxLives: 5,
    gems: Number(state.gemas) || 0,
    stage: Number(state.etapa) || 1,
    level: Number(state.nivel) || 1,
    infiniteHeartsActive: Boolean(state.corazones_ilimitados_activos),
    infiniteHeartsRemainingSeconds: Number(state.corazones_ilimitados_segundos_restantes) || 0,
    usuario: state.usuario,
    joinedAt: state.creado_en || null,
    profilePhotoUrl: state.foto_perfil_base64 || state.foto_perfil_url || null,
    experience: Number(state.experiencia) || 0,
    progress: Number(state.progreso) || 0,
    streakDays: Number(state.dias_racha) || 0,
    lessonsCompleted: Number(state.lecciones_terminadas) || 0,
    timeInvestedSeconds: Number(state.tiempo_invertido_segundos) || 0,
  };
}

export async function purchaseStoreItemGlobal(productId) {
  const usuario = getUser();
  const state = await purchaseStoreItem(usuario, productId);
  return {
    lives: Number(state.vidas) || 0,
    maxLives: 5,
    gems: Number(state.gemas) || 0,
    stage: Number(state.etapa) || 1,
    level: Number(state.nivel) || 1,
    infiniteHeartsActive: Boolean(state.corazones_ilimitados_activos),
    infiniteHeartsRemainingSeconds: Number(state.corazones_ilimitados_segundos_restantes) || 0,
    usuario: state.usuario,
    joinedAt: state.creado_en || null,
    profilePhotoUrl: state.foto_perfil_base64 || state.foto_perfil_url || null,
    experience: Number(state.experiencia) || 0,
    progress: Number(state.progreso) || 0,
    streakDays: Number(state.dias_racha) || 0,
    lessonsCompleted: Number(state.lecciones_terminadas) || 0,
    timeInvestedSeconds: Number(state.tiempo_invertido_segundos) || 0,
  };
}
