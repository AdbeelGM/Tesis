import { Router } from "express";
import { pool } from "../db.js";

export const questionsRouter = Router();

questionsRouter.get("/", (req, res) => {
  res.json({ ok: true, message: "questionsRouter funcionando" });
});

// Whitelist para evitar SQL injection por nombre de tabla
const allowedTableNames = new Set([
  "abecedario",
  "palabrascomunes",
  "familia",
  "viajes",
  "comida"
]);

const tableAliases = {
  // compatibilidad hacia atrás
  palabras_comunes: "palabrascomunes",
};

function getAndValidateCategorias(req, res) {
  const categoriasRaw = req.query.categoria;
  if (!categoriasRaw) {
    res.status(400).json({ error: "Falta categoria" });
    return null;
  }

  const categorias = String(categoriasRaw)
    .split(",")
    .map(c => c.trim())
    .filter(Boolean);

  if (categorias.length === 0) {
    res.status(400).json({ error: "Categoria inválida" });
    return null;
  }

  const normalizadas = categorias.map((c) => tableAliases[c] || c);
  const unicas = [...new Set(normalizadas)];
  const invalida = unicas.find(c => !allowedTableNames.has(c));
  if (invalida) {
    res.status(400).json({ error: "Categoria no permitida" });
    return null;
  }

  return unicas;
}

function buildUnionSubquery(categorias) {
  return categorias
    .map((tabla) => `SELECT id, media_ruta, respuesta, dificultad FROM ${tabla}`)
    .join(" UNION ALL ");
}

function getAndValidateDificultades(req, res) {
  const dificultadesRaw = req.query.dificultad ?? "1";
  const dificultades = String(dificultadesRaw)
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d > 0);

  if (dificultades.length === 0) {
    res.status(400).json({ error: "Dificultad inválida" });
    return null;
  }

  return [...new Set(dificultades)];
}

function buildInClause(values) {
  return values.map(() => "?").join(", ");
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
    const categorias = getAndValidateCategorias(req, res);
    if (!categorias) return;

    const dificultades = getAndValidateDificultades(req, res);
    if (!dificultades) return;
    const limit = Number(req.query.limit || 5);
    const source = buildUnionSubquery(categorias);
    const dificultadesIn = buildInClause(dificultades);

    // 1) Traer N correctas aleatorias de las categorias/dificultades
    const [correctRows] = await pool.query(
      `SELECT id, media_ruta, respuesta, dificultad
       FROM (${source}) AS src
       WHERE dificultad IN (${dificultadesIn})
       ORDER BY RAND()
       LIMIT ?`,
      [...dificultades, limit]
    );

    // 2) Para cada correcta, traer 3 incorrectas aleatorias.
    //    Priorizamos la misma dificultad y, si no alcanza, completamos con otras dificultades.
    const questions = [];
    for (const row of correctRows) {
      const [sameLevelWrongRows] = await pool.query(
        `SELECT respuesta
         FROM (${source}) AS src
         WHERE dificultad = ? AND id <> ? AND respuesta <> ?
         ORDER BY RAND()
         LIMIT 3`,
        [row.dificultad, row.id, row.respuesta]
      );

      let wrongOptions = sameLevelWrongRows.map(r => r.respuesta);

      if (wrongOptions.length < 3) {
        const placeholders = wrongOptions.map(() => "?").join(", ");
        const exclusionClause = placeholders
          ? `AND respuesta NOT IN (${placeholders})`
          : "";

        const [fallbackWrongRows] = await pool.query(
          `SELECT respuesta
           FROM (${source}) AS src
           WHERE dificultad IN (${dificultadesIn}) AND id <> ? AND respuesta <> ? ${exclusionClause}
           ORDER BY RAND()
           LIMIT ?`,
          [...dificultades, row.id, row.respuesta, ...wrongOptions, 3 - wrongOptions.length]
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
    const categorias = getAndValidateCategorias(req, res);
    if (!categorias) return;

    const dificultades = getAndValidateDificultades(req, res);
    if (!dificultades) return;
    const limit = Number(req.query.limit || 5);
    const source = buildUnionSubquery(categorias);
    const dificultadesIn = buildInClause(dificultades);

    // Tomamos "limit" señas base (cada una con su respuesta correcta)
    const [rows] = await pool.query(
      `SELECT id, media_ruta, respuesta
       FROM (${source}) AS src
       WHERE dificultad IN (${dificultadesIn})
       ORDER BY RAND()
       LIMIT ?`,
      [...dificultades, limit]
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
           FROM (${source}) AS src
           WHERE dificultad IN (${dificultadesIn}) AND id <> ? AND respuesta <> ?
           ORDER BY RAND()
           LIMIT 1`,
          [...dificultades, row.id, row.respuesta]
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
    const categorias = getAndValidateCategorias(req, res);
    if (!categorias) return;

    const dificultades = getAndValidateDificultades(req, res);
    if (!dificultades) return;
    const limit = Number(req.query.limit || 5);
    const source = buildUnionSubquery(categorias);
    const dificultadesIn = buildInClause(dificultades);

    const [rows] = await pool.query(
      `SELECT media_ruta, respuesta
       FROM (${source}) AS src
       WHERE dificultad IN (${dificultadesIn})
       ORDER BY RAND()
       LIMIT ?`,
      [...dificultades, limit]
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
