// js/game-state.js
const KEY = "lsmquest_state_v1";

const DEFAULT_STATE = {
  lives: 3,
  maxLives: 5,
  gems: 500,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const s = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...s,
      lives: clamp(s.lives ?? DEFAULT_STATE.lives, 0, s.maxLives ?? DEFAULT_STATE.maxLives),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function loseLifeGlobal(n = 1) {
  const s = loadState();
  s.lives = clamp(s.lives - n, 0, s.maxLives);
  saveState(s);
  return s;
}

export function setLives(lives) {
  const s = loadState();
  s.lives = clamp(lives, 0, s.maxLives);
  saveState(s);
  return s;
}

function clamp(n, min, max) {
  n = Number(n);
  if (!Number.isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}
