/*
 * Nombre: statusbar.js
 * Descripción: Contiene estilos o lógica de soporte para statusbar.
 * Módulo: Proyecto LSM Gamificada
 */
import { loadState } from "./game-state.js";
import { updateInfiniteHeartsIndicator } from "./infinite-hearts-indicator.js";

const FALLBACK_STATE = {
  level: 3,
  gems: 450,
  lives: 5,
  maxLives: 5,
  infiniteHeartsActive: false,
  infiniteHeartsRemainingSeconds: 0,
};

export async function refreshStatusBar() {
  const livesLabel = document.getElementById("lives-label");
  const gemsLabel = document.getElementById("gems-label");

  try {
    const s = await loadState();
    if (livesLabel) livesLabel.textContent = s.infiniteHeartsActive ? "" : `${s.lives}`;
    updateInfiniteHeartsIndicator(livesLabel?.closest(".status-pill--lives"), s);
    if (gemsLabel) gemsLabel.textContent = `${s.gems}`;
    window.currentUserState = s;
  } catch {
    if (livesLabel) livesLabel.textContent = `${FALLBACK_STATE.lives}`;
    updateInfiniteHeartsIndicator(livesLabel?.closest(".status-pill--lives"), FALLBACK_STATE);
    if (gemsLabel) gemsLabel.textContent = `${FALLBACK_STATE.gems}`;
    window.currentUserState = FALLBACK_STATE;
  }
}

document.addEventListener("DOMContentLoaded", refreshStatusBar);
