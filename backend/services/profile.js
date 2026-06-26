/**
 * @file profile.js
 * @description Compone el estado de usuario respetando el esquema real de la tabla usuarios.
 * @module Perfil
 */
import { pool } from "../db.js";
import { applyLifeRegen } from "./lives.js";

export const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024;

const OPTIONAL_USER_DEFAULTS = {
  vidas: 5,
  gemas: 0,
  etapa: 1,
  nivel: 1,
  vidas_actualizado_en: null,
  corazones_ilimitados_desde: null,
  corazones_ilimitados_hasta: null,
  creado_en: null,
  foto_perfil_url: null,
  foto_perfil: null,
  foto_perfil_mime: null,
  experiencia: 0,
  progreso: 0,
  dias_racha: 0,
  lecciones_terminadas: 0,
  tiempo_invertido_segundos: 0,
};

let userSchemaPromise = null;
let userColumns = new Set();

/**
 * Valida únicamente las columnas reales obligatorias de la tabla usuarios.
 * El progreso, tienda y perfil son opcionales para que el backend funcione con
 * el esquema compartido: usuarios(usuario, contraseña).
 * @returns {Promise<void>} No devuelve valor; lanza error si falta la tabla o las columnas base.
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

  userColumns = new Set(columns.map((column) => String(column.COLUMN_NAME || column.column_name).toLowerCase()));
  const missingColumns = ["usuario", "contraseña"].filter((column) => !userColumns.has(column));

  if (missingColumns.length > 0) {
    throw new Error(`La tabla usuarios no tiene las columnas requeridas: ${missingColumns.join(", ")}`);
  }
}

export function ensureUserSchemaReady() {
  if (!userSchemaPromise) {
    userSchemaPromise = ensureUserSchema().catch((err) => {
      userSchemaPromise = null;
      throw err;
    });
  }

  return userSchemaPromise;
}

export function hasUserColumn(column) {
  return userColumns.has(String(column).toLowerCase());
}

function buildUserSelect() {
  const optionalColumns = Object.keys(OPTIONAL_USER_DEFAULTS).filter(hasUserColumn);
  return ["usuario", ...optionalColumns.map((column) => `\`${column}\``)].join(", ");
}

export async function getUserState(usuario) {
  await ensureUserSchemaReady();
  if (hasUserColumn("vidas") && hasUserColumn("vidas_actualizado_en")) {
    await applyLifeRegen(usuario);
  }

  const [rows] = await pool.query(
    `SELECT ${buildUserSelect()}
     FROM usuarios
     WHERE usuario = ?
     LIMIT 1`,
    [usuario]
  );
  const user = rows[0] || null;
  if (!user) return null;

  const state = { ...OPTIONAL_USER_DEFAULTS, ...user };
  const now = new Date();
  const unlimitedUntil = state.corazones_ilimitados_hasta ? new Date(state.corazones_ilimitados_hasta) : null;
  const unlimitedActive = Boolean(unlimitedUntil && unlimitedUntil > now);
  const unlimitedRemainingSeconds = unlimitedActive
    ? Math.floor((unlimitedUntil.getTime() - now.getTime()) / 1000)
    : 0;

  return {
    ...state,
    foto_perfil_base64: state.foto_perfil && state.foto_perfil_mime
      ? `data:${state.foto_perfil_mime};base64,${Buffer.from(state.foto_perfil).toString("base64")}`
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
    photoBuffer = Buffer.from(dataUrlMatch[2], "base64");
    if (photoBuffer.length > MAX_PROFILE_PHOTO_BYTES) {
      const err = new Error("La foto de perfil excede 10 MB");
      err.status = 400;
      throw err;
    }
  }

  return { photoBuffer, mimeType, photoUrl };
}
