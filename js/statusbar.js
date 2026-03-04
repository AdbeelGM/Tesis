import { loadState } from "./game-state.js";

document.addEventListener("DOMContentLoaded", () => {
  const s = loadState();

  const livesLabel = document.getElementById("lives-label");
  const gemsLabel = document.getElementById("gems-label");

  if (livesLabel) livesLabel.textContent = `${s.lives} / ${s.maxLives}`;
  if (gemsLabel) gemsLabel.textContent = `${s.gems}`;
});
