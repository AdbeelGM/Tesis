/*
 * Nombre: profile.js
 * Descripción: Gestiona esquema, estado, métricas y foto de perfil del usuario.
 * Módulo: Backend / Servicios de usuario
 */
import { pool } from "../db.js";
import { applyLifeRegen } from "./lives.js";

export const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024;

export async function ensureUserSchema() {
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS vidas_actualizado_en DATETIME NULL`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS corazones_ilimitados_desde DATETIME NULL`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS corazones_ilimitados_hasta DATETIME NULL`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS foto_perfil_url VARCHAR(500) NULL`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS foto_perfil LONGBLOB NULL`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS foto_perfil_mime VARCHAR(100) NULL`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS experiencia INT NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS progreso INT NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS dias_racha INT NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS lecciones_terminadas INT NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS tiempo_invertido_segundos INT NOT NULL DEFAULT 0`);
}

export async function getUserState(usuario) {
  await applyLifeRegen(usuario);
  const [rows] = await pool.query(
    `SELECT usuario, vidas, gemas, etapa, nivel, vidas_actualizado_en, corazones_ilimitados_desde, corazones_ilimitados_hasta,
            creado_en, foto_perfil_url, foto_perfil, foto_perfil_mime, experiencia, progreso, dias_racha, lecciones_terminadas, tiempo_invertido_segundos
     FROM Usuarios
     WHERE usuario = ?
     LIMIT 1`,
    [usuario]
  );
  const user = rows[0] || null;
  if (!user) return null;

  const now = new Date();
  const unlimitedUntil = user.corazones_ilimitados_hasta ? new Date(user.corazones_ilimitados_hasta) : null;
  const unlimitedActive = Boolean(unlimitedUntil && unlimitedUntil > now);
  const unlimitedRemainingSeconds = unlimitedActive
    ? Math.floor((unlimitedUntil.getTime() - now.getTime()) / 1000)
    : 0;

  return {
    ...user,
    foto_perfil_base64: user.foto_perfil && user.foto_perfil_mime
      ? `data:${user.foto_perfil_mime};base64,${Buffer.from(user.foto_perfil).toString("base64")}`
      : null,
    corazones_ilimitados_activos: unlimitedActive,
    corazones_ilimitados_segundos_restantes: Math.max(0, unlimitedRemainingSeconds),
  };
}

export function parseProfilePhotoPayload({ dataUrl, photoUrl = null }) {
  let photoBuffer = null;
  let mimeType = null;

  if (dataUrl) {
    const dataUrlMatch = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      const err = new Error("Formato de imagen inválido");
      err.status = 400;
      throw err;
    }

    mimeType = dataUrlMatch[1];
    const b64 = dataUrlMatch[2];
    photoBuffer = Buffer.from(b64, "base64");
    if (photoBuffer.length > MAX_PROFILE_PHOTO_BYTES) {
      const err = new Error("La foto de perfil excede 10 MB");
      err.status = 400;
      throw err;
    }
  }

  return { photoBuffer, mimeType, photoUrl };
}
