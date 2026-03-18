import { Router } from "express";
import { pool } from "../db.js";

export const questionsRouter = Router();

questionsRouter.get("/", (req, res) => {
  res.json({ ok: true, message: "questionsRouter funcionando" });
});

// Whitelist para evitar SQL injection por nombre de tabla
const allowedTables = new Set(["abecedario"]);

function getAndValidateCategoria(req, res) {
  const categoria = req.query.categoria;
  if (!categoria) {
    res.status(400).json({ error: "Falta categoria" });
    return null;
  }
  if (!allowedTables.has(categoria)) {
    res.status(400).json({ error: "Categoria no permitida" });
    return null;
  }
  return categoria;
}

/**
 * GET /api/questions/multiple-choice?categoria=abecedario&dificultad=1&limit=5
 * Devuelve:
 * [
 *  { media_ruta, correcta, opciones:[...4] }
 * ]
 */
questionsRouter.get("/multiple-choice", async (req, res) => {
  try {
    const categoria = getAndValidateCategoria(req, res);
    if (!categoria) return;

    const dificultad = Number(req.query.dificultad || 1);
    const limit = Number(req.query.limit || 5);

    // 1) Traer N correctas aleatorias de esa tabla/dificultad
    const [correctRows] = await pool.query(
      `SELECT id, media_ruta, respuesta
       FROM ${categoria}
       WHERE dificultad = ?
       ORDER BY RAND()
       LIMIT ?`,
      [dificultad, limit]
    );

    // 2) Para cada correcta, traer 3 incorrectas aleatorias.
    //    Priorizamos la misma dificultad y, si no alcanza, completamos con otras dificultades.
    const questions = [];
    for (const row of correctRows) {
      const [sameLevelWrongRows] = await pool.query(
        `SELECT respuesta
         FROM ${categoria}
         WHERE dificultad = ? AND id <> ?
         ORDER BY RAND()
         LIMIT 3`,
        [dificultad, row.id]
      );

      let wrongOptions = sameLevelWrongRows.map(r => r.respuesta);

      if (wrongOptions.length < 3) {
        const placeholders = wrongOptions.map(() => "?").join(", ");
        const exclusionClause = placeholders
          ? `AND respuesta NOT IN (${placeholders})`
          : "";

        const [fallbackWrongRows] = await pool.query(
          `SELECT respuesta
           FROM ${categoria}
           WHERE id <> ? AND respuesta <> ? ${exclusionClause}
           ORDER BY RAND()
           LIMIT ?`,
          [row.id, row.respuesta, ...wrongOptions, 3 - wrongOptions.length]
        );

        wrongOptions = wrongOptions.concat(fallbackWrongRows.map(r => r.respuesta));
      }

      const opciones = shuffle([row.respuesta, ...wrongOptions]).slice(0, 4);
      questions.push({
        media_ruta: row.media_ruta,
        correcta: row.respuesta,
        opciones
      });
    }

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno en multiple-choice" });
  }
});

/**
 * GET /api/questions/true-false?categoria=abecedario&dificultad=1&limit=5
 * Devuelve:
 * [
 *  { media_ruta, pregunta, es_verdadero }
 * ]
 *
 * Lógica:
 * - Si es_verdadero = 1 → la palabra mostrada coincide con la seña (correcta).
 * - Si es_verdadero = 0 → mostramos una palabra distinta (incorrecta).
 *
 * Nota: "pregunta" la construimos con texto para que el front pueda mostrarla.
 */
questionsRouter.get("/true-false", async (req, res) => {
  try {
    const categoria = getAndValidateCategoria(req, res);
    if (!categoria) return;

    const dificultad = Number(req.query.dificultad || 1);
    const limit = Number(req.query.limit || 5);

    // Tomamos "limit" señas base (cada una con su respuesta correcta)
    const [rows] = await pool.query(
      `SELECT id, media_ruta, respuesta
       FROM ${categoria}
       WHERE dificultad = ?
       ORDER BY RAND()
       LIMIT ?`,
      [dificultad, limit]
    );

    const questions = [];
    for (const row of rows) {
      // 50/50 verdadero/falso
      const esVerdadero = Math.random() < 0.5;

      if (esVerdadero) {
        // Verdadero: usamos la respuesta correcta
        questions.push({
          media_ruta: row.media_ruta,
          pregunta: `¿Esta seña corresponde a la palabra "${row.respuesta}"?`,
          es_verdadero: 1
        });
      } else {
        // Falso: elegimos otra respuesta cualquiera distinta
        const [wrongRows] = await pool.query(
          `SELECT respuesta
           FROM ${categoria}
           WHERE dificultad = ? AND id <> ?
           ORDER BY RAND()
           LIMIT 1`,
          [dificultad, row.id]
        );

        const palabraIncorrecta = wrongRows?.[0]?.respuesta || "Otra palabra";

        questions.push({
          media_ruta: row.media_ruta,
          pregunta: `¿Esta seña corresponde a la palabra "${palabraIncorrecta}"?`,
          es_verdadero: 0
        });
      }
    }

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno en true-false" });
  }
});

/**
 * GET /api/questions/text-input?categoria=abecedario&dificultad=1&limit=5
 * Devuelve:
 * [
 *   { media_ruta, pregunta, correcta }
 * ]
 *
 * Lógica:
 * - Muestra la seña y el usuario escribe la palabra (respuesta).
 */
questionsRouter.get("/text-input", async (req, res) => {
  try {
    const categoria = getAndValidateCategoria(req, res);
    if (!categoria) return;

    const dificultad = Number(req.query.dificultad || 1);
    const limit = Number(req.query.limit || 5);

    const [rows] = await pool.query(
      `SELECT media_ruta, respuesta
       FROM ${categoria}
       WHERE dificultad = ?
       ORDER BY RAND()
       LIMIT ?`,
      [dificultad, limit]
    );

    const questions = rows.map(r => ({
      media_ruta: r.media_ruta,
      pregunta: "Escribe la palabra que representa la seña:",
      correcta: r.respuesta
    }));

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno en text-input" });
  }
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
