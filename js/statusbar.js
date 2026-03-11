import { loadState } from "./game-state.js";

const FALLBACK_STATE = {
  level: 3,
  gems: 450,
  lives: 5,
  maxLives: 5,
};

export async function refreshStatusBar() {
  const livesLabel = document.getElementById("lives-label");
  const gemsLabel = document.getElementById("gems-label");

  try {
    const s = await loadState();
    if (livesLabel) livesLabel.textContent = `${s.lives}`;
    if (gemsLabel) gemsLabel.textContent = `${s.gems}`;
    window.currentUserState = s;
  } catch {
    if (livesLabel) livesLabel.textContent = `${FALLBACK_STATE.lives}`;
    if (gemsLabel) gemsLabel.textContent = `${FALLBACK_STATE.gems}`;
    window.currentUserState = FALLBACK_STATE;
  }
}

document.addEventListener("DOMContentLoaded", refreshStatusBar);
