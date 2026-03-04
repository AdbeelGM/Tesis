import { Router } from "express";
import { pool } from "../db.js";

export const userRouter = Router();

const MAX_LIVES = 5;
const LIFE_INTERVAL_MINUTES = 5;

async function ensureSchema() {
  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS vidas_actualizado_en DATETIME NULL
  `);
}

ensureSchema().catch((err) => {
  console.error("No se pudo asegurar la columna vidas_actualizado_en:", err.message);
});

async function applyLifeRegen(usuario) {
  const [rows] = await pool.query(
    `SELECT usuario, vidas, vidas_actualizado_en
     FROM Usuarios
     WHERE usuario = ?
     LIMIT 1`,
    [usuario]
  );

  const user = rows[0];
  if (!user) return null;

  const now = new Date();
  const lastUpdate = user.vidas_actualizado_en ? new Date(user.vidas_actualizado_en) : now;

  if (!user.vidas_actualizado_en) {
    await pool.query(
      `UPDATE Usuarios SET vidas_actualizado_en = ? WHERE usuario = ?`,
      [now, usuario]
    );
    return { ...user, vidas_actualizado_en: now };
  }

  if (user.vidas >= MAX_LIVES) {
    await pool.query(
      `UPDATE Usuarios SET vidas = ?, vidas_actualizado_en = ? WHERE usuario = ?`,
      [MAX_LIVES, now, usuario]
    );
    return { ...user, vidas: MAX_LIVES, vidas_actualizado_en: now };
  }

  const elapsedMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
  const recoverable = Math.floor(elapsedMinutes / LIFE_INTERVAL_MINUTES);

  if (recoverable <= 0) {
    return user;
  }

  const nextLives = Math.min(MAX_LIVES, user.vidas + recoverable);
  const minutesUsed = (nextLives - user.vidas) * LIFE_INTERVAL_MINUTES;
  const nextUpdate = new Date(lastUpdate.getTime() + minutesUsed * 60 * 1000);

  await pool.query(
    `UPDATE Usuarios
     SET vidas = ?, vidas_actualizado_en = ?
     WHERE usuario = ?`,
    [nextLives, nextUpdate, usuario]
  );

  return { ...user, vidas: nextLives, vidas_actualizado_en: nextUpdate };
}

async function getUserState(usuario) {
  await applyLifeRegen(usuario);
  const [rows] = await pool.query(
    `SELECT usuario, vidas, gemas, etapa, nivel
     FROM Usuarios
     WHERE usuario = ?
     LIMIT 1`,
    [usuario]
  );
  return rows[0] || null;
}

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

    await pool.query(`UPDATE Usuarios SET nivel = nivel + 1 WHERE usuario = ?`, [usuario]);

    const updated = await getUserState(usuario);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al completar nivel" });
  }
});
