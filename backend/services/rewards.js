/*
 * Nombre: rewards.js
 * Descripción: Define recompensas de niveles y productos de tienda.
 * Módulo: Backend / Servicios de usuario
 */

export const TOTAL_LEVELS = 15;
export const BASE_GEMS_REWARD = 25;
export const STORE_PRODUCTS = {
  single_heart: { gems: 100, lives: 1, type: "lives" },
  heart_bundle: { gems: 450, lives: 5, type: "lives" },
  infinite_hearts_24h: { gems: 950, hours: 24, type: "infinite" },
};

export function getExperienceRewardForLevel(levelNumber) {
  const level = Math.max(1, Number(levelNumber) || 1);
  const base = 40;
  const linear = level * 25;
  const curve = Math.floor(Math.pow(level, 1.35) * 15);
  return base + linear + curve;
}

export function getGemsRewardForLevel(levelNumber) {
  const level = Math.max(1, Number(levelNumber) || 1);
  return BASE_GEMS_REWARD + Math.floor(level / 3) * 5;
}
