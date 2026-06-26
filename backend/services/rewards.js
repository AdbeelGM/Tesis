/**
 * @file rewards.js
 * @description Define el catálogo de tienda, el total de niveles y las fórmulas de gemas y experiencia otorgadas al completar lecciones.
 * @module Recompensas
 */
export const TOTAL_LEVELS = 15;
export const BASE_GEMS_REWARD = 25;
export const STORE_PRODUCTS = {
  single_heart: { gems: 100, lives: 1, type: "lives" },
  heart_bundle: { gems: 450, lives: 5, type: "lives" },
  infinite_hearts_24h: { gems: 950, hours: 24, type: "infinite" },
};

/**
 * Calcula la experiencia ganada por completar un nivel específico.
 * @param {number} levelNumber - Número de nivel completado.
 * @returns {number} Cantidad de XP que debe sumarse al usuario.
 */
export function getExperienceRewardForLevel(levelNumber) {
  const level = Math.max(1, Number(levelNumber) || 1);
  const base = 40;
  const linear = level * 25;
  const curve = Math.floor(Math.pow(level, 1.35) * 15);
  return base + linear + curve;
}

/**
 * Calcula las gemas otorgadas al completar un nivel.
 * @param {number} levelNumber - Número de nivel completado.
 * @returns {number} Gemas de recompensa para la progresión del jugador.
 */
export function getGemsRewardForLevel(levelNumber) {
  const level = Math.max(1, Number(levelNumber) || 1);
  return BASE_GEMS_REWARD + Math.floor(level / 3) * 5;
}
