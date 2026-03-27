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
  };
}
