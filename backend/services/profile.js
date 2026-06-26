/**
 * @file profile.js
 * @description Valida el esquema existente de usuarios, compone el estado completo del perfil y valida fotos de perfil enviadas por el frontend.
 * @module Perfil
 */
import { pool } from "../db.js";
import { applyLifeRegen } from "./lives.js";

export const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024;
const USER_COLUMNS = [
  { name: "vidas_actualizado_en", definition: "DATETIME NULL" },
  { name: "corazones_ilimitados_desde", definition: "DATETIME NULL" },
  { name: "corazones_ilimitados_hasta", definition: "DATETIME NULL" },
  { name: "creado_en", definition: "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" },
  { name: "foto_perfil_url", definition: "VARCHAR(500) NULL" },
  { name: "foto_perfil", definition: "LONGBLOB NULL" },
  { name: "foto_perfil_mime", definition: "VARCHAR(100) NULL" },
  { name: "experiencia", definition: "INT NOT NULL DEFAULT 0" },
  { name: "progreso", definition: "INT NOT NULL DEFAULT 0" },
  { name: "dias_racha", definition: "INT NOT NULL DEFAULT 0" },
  { name: "lecciones_terminadas", definition: "INT NOT NULL DEFAULT 0" },
  { name: "tiempo_invertido_segundos", definition: "INT NOT NULL DEFAULT 0" },
];

let userSchemaPromise = null;

/**
 * Valida que la tabla usuarios ya exista con las columnas esperadas por progreso, perfil y tienda.
 * No crea ni altera tablas para respetar el esquema cargado manualmente en la base de datos.
 * @returns {Promise<void>} No devuelve valor; lanza error si falta la tabla o alguna columna requerida.
 */
export async function ensureUserSchema() {
  const [columns] = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND LOWER(table_name) = 'usuarios'`
  );

  if (columns.length === 0) {
    throw new Error("La tabla usuarios no existe en la base de datos configurada");
  }

  const existingColumns = new Set(
    columns.map((column) => String(column.COLUMN_NAME || column.column_name).toLowerCase())
  );
  const requiredColumns = ["usuario", "contraseña", "vidas", "gemas", "etapa", "nivel", ...USER_COLUMNS.map((column) => column.name)];
  const missingColumns = requiredColumns.filter((column) => !existingColumns.has(column.toLowerCase()));

  if (missingColumns.length > 0) {
    throw new Error(`La tabla usuarios no tiene las columnas requeridas: ${missingColumns.join(", ")}`);
  }
}

/**
 * Ejecuta la validación de esquema una sola vez y comparte la promesa entre rutas concurrentes.
 * @returns {Promise<void>} Promesa de esquema listo para consultas de usuario.
 */
export function ensureUserSchemaReady() {
  if (!userSchemaPromise) {
    userSchemaPromise = ensureUserSchema().catch((err) => {
      userSchemaPromise = null;
      throw err;
    });
  }

  return userSchemaPromise;
}

/**
 * Obtiene el estado completo del usuario, incluyendo regeneración de vidas y foto codificada.
 * @param {string} usuario - Usuario cuyo estado se consultará.
 * @returns {Promise<Object|null>} Estado listo para la API o null si no existe.
 */
export async function getUserState(usuario) {
  await applyLifeRegen(usuario);
  const [rows] = await pool.query(
    `SELECT usuario, vidas, gemas, etapa, nivel, vidas_actualizado_en, corazones_ilimitados_desde, corazones_ilimitados_hasta,
            creado_en, foto_perfil_url, foto_perfil, foto_perfil_mime, experiencia, progreso, dias_racha, lecciones_terminadas, tiempo_invertido_segundos
     FROM usuarios
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

/**
 * Valida y decodifica la foto de perfil recibida desde el frontend.
 * @param {Object} payload - Datos enviados para actualizar la foto.
 * @param {string} payload.dataUrl - Imagen en formato Data URL base64.
 * @param {string|null} payload.photoUrl - URL externa opcional de foto.
 * @returns {Object} Buffer, tipo MIME y URL listos para persistirse.
 */
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
