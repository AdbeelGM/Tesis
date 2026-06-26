/**
 * @file lives.js
 * @description Aplica reglas de vidas solo cuando la tabla usuarios tiene las columnas necesarias.
 * @module Vidas
 */
import { pool } from "../db.js";

export const MAX_LIVES = 5;
export const LIFE_INTERVAL_MINUTES = 5;

export async function applyLifeRegen(usuario) {
  const [rows] = await pool.query(
    `SELECT usuario, vidas, vidas_actualizado_en, corazones_ilimitados_desde, corazones_ilimitados_hasta
     FROM usuarios
     WHERE usuario = ?
     LIMIT 1`,
    [usuario]
  );

  const user = rows[0];
  if (!user) return null;

  const now = new Date();
  const unlimitedUntil = user.corazones_ilimitados_hasta ? new Date(user.corazones_ilimitados_hasta) : null;
  const hasUnlimited = unlimitedUntil && unlimitedUntil > now;

  if (hasUnlimited) {
    if (user.vidas < MAX_LIVES || !user.vidas_actualizado_en) {
      await pool.query(
        `UPDATE usuarios
         SET vidas = ?, vidas_actualizado_en = ?
         WHERE usuario = ?`,
        [MAX_LIVES, now, usuario]
      );
      return { ...user, vidas: MAX_LIVES, vidas_actualizado_en: now };
    }
    return user;
  }

  const lastUpdate = user.vidas_actualizado_en ? new Date(user.vidas_actualizado_en) : now;

  if (!user.vidas_actualizado_en) {
    await pool.query(`UPDATE usuarios SET vidas_actualizado_en = ? WHERE usuario = ?`, [now, usuario]);
    return { ...user, vidas_actualizado_en: now };
  }

  if (user.vidas >= MAX_LIVES) {
    await pool.query(`UPDATE usuarios SET vidas = ?, vidas_actualizado_en = ? WHERE usuario = ?`, [MAX_LIVES, now, usuario]);
    return { ...user, vidas: MAX_LIVES, vidas_actualizado_en: now };
  }

  const elapsedMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
  const recoverable = Math.floor(elapsedMinutes / LIFE_INTERVAL_MINUTES);
  if (recoverable <= 0) return user;

  const nextLives = Math.min(MAX_LIVES, user.vidas + recoverable);
  const minutesUsed = (nextLives - user.vidas) * LIFE_INTERVAL_MINUTES;
  const nextUpdate = new Date(lastUpdate.getTime() + minutesUsed * 60 * 1000);

  await pool.query(`UPDATE usuarios SET vidas = ?, vidas_actualizado_en = ? WHERE usuario = ?`, [nextLives, nextUpdate, usuario]);
  return { ...user, vidas: nextLives, vidas_actualizado_en: nextUpdate };
}
