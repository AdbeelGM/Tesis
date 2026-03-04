import { loadState } from "./game-state.js";

export async function refreshStatusBar() {
  const livesLabel = document.getElementById("lives-label");
  const gemsLabel = document.getElementById("gems-label");

  try {
    const s = await loadState();
    if (livesLabel) livesLabel.textContent = `${s.lives} / ${s.maxLives}`;
    if (gemsLabel) gemsLabel.textContent = `${s.gems}`;
    window.currentUserState = s;
  } catch {
    if (livesLabel) livesLabel.textContent = "-";
    if (gemsLabel) gemsLabel.textContent = "-";
  }
}

document.addEventListener("DOMContentLoaded", refreshStatusBar);
