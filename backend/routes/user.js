/**
 * @file user.js
 * @description Expone la API de usuarios para autenticación, registro, consulta de estado, pérdida de vidas, compras, progreso, tiempo invertido y foto de perfil.
 * @module APIUsuario
 */
import { Router } from "express";
import { pool } from "../db.js";
import { MAX_LIVES } from "../services/lives.js";
import { STORE_PRODUCTS, TOTAL_LEVELS, getExperienceRewardForLevel, getGemsRewardForLevel } from "../services/rewards.js";
import { ensureUserSchemaReady, getUserState, parseProfilePhotoPayload } from "../services/profile.js";

export const userRouter = Router();

userRouter.use(async (req, res, next) => {
  try {
    await ensureUserSchemaReady();
    next();
  } catch (err) {
    console.error("No se pudo asegurar el esquema de usuario:", err.message);
    res.status(500).json({ error: "Error al preparar la base de datos" });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
    }

    const [rows] = await pool.query(
      `SELECT usuario
       FROM Usuarios
       WHERE usuario = ? AND \`contraseña\` = ?
       LIMIT 1`,
      [usuario, password]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const state = await getUserState(usuario);
    return res.json(state);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

userRouter.post("/register", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
    }

    const username = String(usuario).trim();
    const pass = String(password).trim();

    if (username.length < 3 || pass.length < 3) {
      return res.status(400).json({ error: "Usuario y contraseña deben tener al menos 3 caracteres" });
    }

    const [exists] = await pool.query(
      `SELECT usuario FROM Usuarios WHERE usuario = ? LIMIT 1`,
      [username]
    );

    if (exists[0]) {
      return res.status(409).json({ error: "Este usuario ya existe" });
    }

    const now = new Date();

    await pool.query(
      `INSERT INTO Usuarios (usuario, \`contraseña\`, vidas, gemas, etapa, nivel, vidas_actualizado_en)
       VALUES (?, ?, ?, DEFAULT, DEFAULT, DEFAULT, ?)`,
      [username, pass, MAX_LIVES, now]
    );

    const state = await getUserState(username);
    return res.status(201).json(state);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
});

userRouter.get("/state", async (req, res) => {
  try {
    const { usuario } = req.query;
    if (!usuario) return res.status(400).json({ error: "Falta usuario" });

    const state = await getUserState(usuario);
    if (!state) return res.status(404).json({ error: "Usuario no encontrado" });

    return res.json(state);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al cargar estado" });
  }
});

userRouter.post("/lose-life", async (req, res) => {
  try {
    const { usuario, amount = 1 } = req.body;
    if (!usuario) return res.status(400).json({ error: "Falta usuario" });

    const state = await getUserState(usuario);
    if (!state) return res.status(404).json({ error: "Usuario no encontrado" });

    if (state.corazones_ilimitados_activos) {
      return res.json(state);
    }

    const nextLives = Math.max(0, Number(state.vidas) - Number(amount));
    const now = new Date();

    await pool.query(
      `UPDATE Usuarios SET vidas = ?, vidas_actualizado_en = ? WHERE usuario = ?`,
      [nextLives, now, usuario]
    );

    const updated = await getUserState(usuario);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al descontar vida" });
  }
});

userRouter.post("/purchase", async (req, res) => {
  try {
    const { usuario, productId } = req.body;
    if (!usuario || !productId) {
      return res.status(400).json({ error: "Falta usuario o producto" });
    }

    const product = STORE_PRODUCTS[productId];
    if (!product) {
      return res.status(400).json({ error: "Producto inválido" });
    }

    const state = await getUserState(usuario);
    if (!state) return res.status(404).json({ error: "Usuario no encontrado" });

    if (Number(state.gemas) < product.gems) {
      return res.status(400).json({ error: "No tienes gemas suficientes" });
    }

    if (product.type === "lives" && Number(state.vidas) >= MAX_LIVES) {
      return res.status(400).json({ error: "Ya tienes el máximo de corazones" });
    }

    if (product.type === "infinite" && state.corazones_ilimitados_activos) {
      return res.status(400).json({ error: "Ya tienes corazones ilimitados activos" });
    }

    const now = new Date();
    const nextGems = Number(state.gemas) - product.gems;

    if (product.type === "lives") {
      const nextLives = Math.min(MAX_LIVES, Number(state.vidas) + product.lives);
      const nextLifeUpdatedAt = nextLives >= MAX_LIVES ? now : state.vidas_actualizado_en || now;

      await pool.query(
        `UPDATE Usuarios
         SET gemas = ?, vidas = ?, vidas_actualizado_en = ?
         WHERE usuario = ?`,
        [nextGems, nextLives, nextLifeUpdatedAt, usuario]
      );
    } else {
      const startsAt = now;
      const endsAt = new Date(startsAt.getTime() + product.hours * 60 * 60 * 1000);

      await pool.query(
        `UPDATE Usuarios
         SET gemas = ?, vidas = ?, vidas_actualizado_en = ?, corazones_ilimitados_desde = ?, corazones_ilimitados_hasta = ?
         WHERE usuario = ?`,
        [nextGems, MAX_LIVES, now, now, endsAt, usuario]
      );
    }

    const updated = await getUserState(usuario);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al comprar en la tienda" });
  }
});

userRouter.post("/complete-level", async (req, res) => {
  try {
    const { usuario, level } = req.body;
    if (!usuario || !level) return res.status(400).json({ error: "Falta usuario o nivel" });

    const state = await getUserState(usuario);
    if (!state) return res.status(404).json({ error: "Usuario no encontrado" });

    const currentLevel = Number(state.nivel);
    const requestedLevel = Number(level);

    if (requestedLevel !== currentLevel) {
      return res.status(403).json({ error: "Nivel bloqueado para este usuario" });
    }

    const xpReward = getExperienceRewardForLevel(requestedLevel);
    const gemsReward = getGemsRewardForLevel(requestedLevel);
    const nextLevel = currentLevel + 1;
    const nextProgress = Math.min(
      100,
      Math.round((Math.min(nextLevel - 1, TOTAL_LEVELS) / TOTAL_LEVELS) * 100)
    );

    await pool.query(
      `UPDATE Usuarios
       SET nivel = nivel + 1,
           experiencia = experiencia + ?,
           gemas = COALESCE(gemas, 0) + ?,
           lecciones_terminadas = lecciones_terminadas + 1,
           progreso = GREATEST(progreso, ?)
       WHERE usuario = ?`,
      [xpReward, gemsReward, nextProgress, usuario]
    );

    const updated = await getUserState(usuario);
    return res.json({ ...updated, xp_ganada: xpReward, gemas_ganadas: gemsReward });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al completar nivel" });
  }
});

userRouter.post("/time-invested", async (req, res) => {
  try {
    const { usuario, seconds } = req.body;
    if (!usuario) return res.status(400).json({ error: "Falta usuario" });

    const increment = Math.max(0, Math.floor(Number(seconds) || 0));
    if (increment <= 0) {
      const state = await getUserState(usuario);
      if (!state) return res.status(404).json({ error: "Usuario no encontrado" });
      return res.json(state);
    }

    await pool.query(
      `UPDATE Usuarios
       SET tiempo_invertido_segundos = tiempo_invertido_segundos + ?
       WHERE usuario = ?`,
      [increment, usuario]
    );

    const updated = await getUserState(usuario);
    if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al guardar tiempo invertido" });
  }
});

userRouter.post("/profile-photo", async (req, res) => {
  try {
    const { usuario, dataUrl, photoUrl = null } = req.body;
    if (!usuario) return res.status(400).json({ error: "Falta usuario" });

    if (!dataUrl && !photoUrl) {
      return res.status(400).json({ error: "Falta foto de perfil" });
    }

    const { photoBuffer, mimeType } = parseProfilePhotoPayload({ dataUrl, photoUrl });

    await pool.query(
      `UPDATE Usuarios
       SET foto_perfil = ?, foto_perfil_mime = ?, foto_perfil_url = ?
       WHERE usuario = ?`,
      [photoBuffer, mimeType, photoUrl, usuario]
    );

    const updated = await getUserState(usuario);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.status ? err.message : "Error al guardar foto de perfil" });
  }
});
