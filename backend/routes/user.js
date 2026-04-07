import { Router } from "express";
import { pool } from "../db.js";

export const userRouter = Router();

const MAX_LIVES = 5;
const LIFE_INTERVAL_MINUTES = 5;
const STORE_PRODUCTS = {
  single_heart: { gems: 100, lives: 1, type: "lives" },
  heart_bundle: { gems: 450, lives: 5, type: "lives" },
  infinite_hearts_24h: { gems: 950, hours: 24, type: "infinite" },
};
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

async function ensureSchema() {
  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS vidas_actualizado_en DATETIME NULL
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS corazones_ilimitados_desde DATETIME NULL
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS corazones_ilimitados_hasta DATETIME NULL
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS foto_perfil_url VARCHAR(500) NULL
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS foto_perfil LONGBLOB NULL
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS foto_perfil_mime VARCHAR(100) NULL
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS experiencia INT NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS progreso INT NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS dias_racha INT NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS lecciones_terminadas INT NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE Usuarios
    ADD COLUMN IF NOT EXISTS tiempo_invertido_segundos INT NOT NULL DEFAULT 0
  `);
}

ensureSchema().catch((err) => {
  console.error("No se pudo asegurar la columna vidas_actualizado_en:", err.message);
});

async function applyLifeRegen(usuario) {
  const [rows] = await pool.query(
    `SELECT usuario, vidas, vidas_actualizado_en, corazones_ilimitados_desde, corazones_ilimitados_hasta
     FROM Usuarios
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
        `UPDATE Usuarios
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
  const hasBinaryProfilePhoto = user.foto_perfil && user.foto_perfil_mime;
  const profilePhotoDataUrl = hasBinaryProfilePhoto
    ? `data:${user.foto_perfil_mime};base64,${Buffer.from(user.foto_perfil).toString("base64")}`
    : null;

  return {
    ...user,
    foto_perfil_base64: profilePhotoDataUrl,
    corazones_ilimitados_activos: unlimitedActive,
    corazones_ilimitados_segundos_restantes: Math.max(0, unlimitedRemainingSeconds),
  };
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
      `INSERT INTO Usuarios (
         usuario, \`contraseña\`, vidas, gemas, etapa, nivel, vidas_actualizado_en,
         creado_en, foto_perfil_url, foto_perfil, foto_perfil_mime, experiencia, progreso, dias_racha, lecciones_terminadas, tiempo_invertido_segundos
       )
       VALUES (?, ?, ?, DEFAULT, DEFAULT, DEFAULT, ?, ?, NULL, NULL, NULL, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT)`,
      [username, pass, MAX_LIVES, now, now]
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

    const xpGanada = 100;
    const segundosInvertidos = 300;
    const progresoActual = Number(state.progreso) || 0;
    const progresoSiguiente = Math.min(100, progresoActual + 5);

    await pool.query(
      `UPDATE Usuarios
       SET nivel = nivel + 1,
           experiencia = experiencia + ?,
           lecciones_terminadas = lecciones_terminadas + 1,
           tiempo_invertido_segundos = tiempo_invertido_segundos + ?,
           progreso = ?
       WHERE usuario = ?`,
      [xpGanada, segundosInvertidos, progresoSiguiente, usuario]
    );

    const updated = await getUserState(usuario);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al completar nivel" });
  }
});

userRouter.post("/profile", async (req, res) => {
  try {
    const { usuario, foto_perfil_base64, dias_racha, progreso } = req.body;
    if (!usuario) return res.status(400).json({ error: "Falta usuario" });

    const state = await getUserState(usuario);
    if (!state) return res.status(404).json({ error: "Usuario no encontrado" });

    const nextRacha = Number.isFinite(Number(dias_racha)) ? Math.max(0, Number(dias_racha)) : Number(state.dias_racha) || 0;
    const nextProgreso = Number.isFinite(Number(progreso)) ? Math.min(100, Math.max(0, Number(progreso))) : Number(state.progreso) || 0;
    let nextFotoBuffer = state.foto_perfil || null;
    let nextFotoMime = state.foto_perfil_mime || null;

    if (typeof foto_perfil_base64 === "string") {
      const raw = foto_perfil_base64.trim();
      if (!raw) {
        nextFotoBuffer = null;
        nextFotoMime = null;
      } else {
        const parsed = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!parsed) {
          return res.status(400).json({ error: "Formato de foto inválido. Usa Data URL base64 (image/*)" });
        }
        const mime = parsed[1];
        const base64Payload = parsed[2];
        const buffer = Buffer.from(base64Payload, "base64");
        if (!buffer.length || buffer.byteLength > MAX_PROFILE_IMAGE_BYTES) {
          return res.status(400).json({ error: "La imagen debe pesar entre 1 byte y 2 MB" });
        }
        nextFotoBuffer = buffer;
        nextFotoMime = mime;
      }
    }

    await pool.query(
      `UPDATE Usuarios
       SET foto_perfil_url = NULL, foto_perfil = ?, foto_perfil_mime = ?, dias_racha = ?, progreso = ?
       WHERE usuario = ?`,
      [nextFotoBuffer, nextFotoMime, nextRacha, nextProgreso, usuario]
    );

    const updated = await getUserState(usuario);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar perfil" });
  }
});
