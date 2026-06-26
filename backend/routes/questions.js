/**
 * @file questions.js
 * @description Construye ejercicios desde tablas de vocabulario LSM validadas y expone endpoints de opción múltiple, verdadero/falso y escritura.
 * @module APIPreguntas
 */
import { Router } from "express";
import { pool } from "../db.js";

export const questionsRouter = Router();

/**
 * Verifica que el router de preguntas esté montado.
 * @param {import("express").Request} req - Petición HTTP de verificación.
 * @param {import("express").Response} res - Respuesta con estado del router.
 * @returns {void}
 */
questionsRouter.get("/", (req, res) => {
  res.json({ ok: true, message: "questionsRouter funcionando" });
});

const tableAliases = {
  continentespaises: "continentespaíses",
  personajeshistoricos: "personajeshistóricos",
  proteccioncivil: "proteccióncivil",
  tecnologia: "tecnología",
  ambitojuridico: "ámbitojurídico",
};

const vocabularyTables = [
  "abecedario",
  "ámbitojurídico",
  "colores",
  "continentespaíses",
  "expresiones",
  "familia",
  "museoarte",
  "numeros",
  "personajeshistóricos",
  "profesiones",
  "pronombres",
  "proteccióncivil",
  "salud",
  "saludos",
  "tecnología",
  "temporalidad",
  "transportes",
  "vestimenta",
];

/**
 * Valida que el nombre de una tabla solo use letras, números o guiones bajos.
 * @param {string} name - Nombre de categoría/tabla solicitado.
 * @returns {boolean} true si el nombre es seguro para validación posterior.
 */
function isSafeTableName(name) {
  return /^[\p{L}\p{N}_]+$/u.test(name);
}

/**
 * Escapa un identificador SQL para usarlo como nombre de tabla en consultas dinámicas validadas.
 * @param {string} identifier - Nombre de tabla que se envolverá con backticks.
 * @returns {string} Identificador escapado para MySQL.
 */
function quoteIdentifier(identifier) {
  return `\`${String(identifier).replaceAll("`", "``")}\``;
}

/**
 * Convierte valores constantes en una lista SQL segura para cláusulas IN internas.
 * @param {string[]} values - Valores controlados por el código, no por el usuario.
 * @returns {string} Lista SQL entre comillas simples.
 */
function buildQuotedList(values) {
  return values.map((value) => `'${String(value).replaceAll("'", "''")}'`).join(", ");
}

/**
 * Consulta qué tablas de vocabulario tienen las columnas mínimas para generar ejercicios.
 * @returns {Promise<Set<string>>} Conjunto de tablas disponibles como categorías.
 */
async function getEligibleTables() {
  const [rows] = await pool.query(
    `SELECT c.table_name AS table_name
     FROM information_schema.columns c
     WHERE c.table_schema = DATABASE()
       AND c.table_name IN (${buildQuotedList(vocabularyTables)})
     GROUP BY c.table_name
     HAVING SUM(LOWER(c.column_name) = 'id') > 0
        AND SUM(LOWER(c.column_name) = 'media_fuente') > 0
        AND SUM(LOWER(c.column_name) = 'respuesta') > 0
        AND SUM(LOWER(c.column_name) = 'dificultad') > 0`
  );

  return new Set(rows.map((row) => row.table_name));
}

/**
 * Lee, normaliza y valida las categorías solicitadas en la petición de ejercicios.
 * @param {import("express").Request} req - Petición HTTP con query categoria.
 * @param {import("express").Response} res - Respuesta usada para reportar errores de validación.
 * @returns {Promise<string[]|null>} Categorías únicas válidas o null si se respondió error.
 */
async function getAndValidateCategorias(req, res) {
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

  const normalizadas = categorias.map((c) => tableAliases[c] || c).map((c) => c.trim());
  const nombreInvalido = normalizadas.find((c) => !isSafeTableName(c));
  if (nombreInvalido) {
    res.status(400).json({ error: "Categoria inválida" });
    return null;
  }

  const unicas = [...new Set(normalizadas)];
  const allowedTableNames = await getEligibleTables();
  const invalida = unicas.find(c => !allowedTableNames.has(c));
  if (invalida) {
    res.status(400).json({ error: `Categoria no disponible: ${invalida}` });
    return null;
  }

  return unicas;
}

/**
 * Construye una subconsulta UNION ALL que unifica tablas de vocabulario con columnas compatibles.
 * @param {string[]} categorias - Tablas validadas que formarán la fuente de preguntas.
 * @returns {Promise<string>} SQL de subconsulta para seleccionar preguntas de varias categorías.
 */
async function buildUnionSubquery(categorias) {
  const categoriasIn = buildInClause(categorias);
  const [columnRows] = await pool.query(
    `SELECT table_name, LOWER(column_name) AS column_key, column_name
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name IN (${categoriasIn})
       AND LOWER(column_name) = 'respuesta_alt'`,
    categorias
  );

  const tablesWithRespuestaAlt = new Set(columnRows.map((row) => row.table_name));

  return categorias
    .map((tabla) => {
      const mediaExpr = quoteIdentifier("media_fuente");
      const mediaTipoExpr = `CASE
             WHEN LOWER(${mediaExpr}) REGEXP '^(https://|http://|)(www[.]|)(youtube[.]com|youtu[.]be)/' THEN 'youtube'
             WHEN SUBSTRING_INDEX(LOWER(${mediaExpr}), CHAR(63), 1) REGEXP '[.](mp4|webm|ogg)$' THEN 'video'
             ELSE 'imagen'
           END`;
      const respuestaAltExpr = tabla === "numeros" && tablesWithRespuestaAlt.has(tabla) ? quoteIdentifier("respuesta_alt") : "NULL";

      return `SELECT id, '${tabla}' AS categoria_origen, ${mediaTipoExpr} AS media_tipo, ${mediaExpr} AS media_fuente, respuesta, ${respuestaAltExpr} AS respuesta_alt, dificultad FROM ${quoteIdentifier(tabla)}`;
    })
    .join(" UNION ALL ");
}

/**
 * Obtiene un límite positivo de resultados desde la query o usa un valor de respaldo.
 * @param {import("express").Request} req - Petición HTTP con query limit opcional.
 * @param {number} fallback - Cantidad usada cuando el límite no es válido.
 * @returns {number} Límite seguro para la consulta.
 */
function getValidatedLimit(req, fallback = 5) {
  // Mantiene un límite positivo para proteger la API de consultas excesivas o inválidas.
  const limit = Number(req.query.limit || fallback);
  return Number.isInteger(limit) && limit > 0 ? limit : fallback;
}

/**
 * Normaliza y valida una o varias dificultades recibidas en la query.
 * @param {import("express").Request} req - Petición HTTP con query dificultad opcional.
 * @param {import("express").Response} res - Respuesta usada para reportar errores.
 * @returns {number[]|null} Dificultades únicas válidas o null si se respondió error.
 */
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

/**
 * Genera placeholders para una cláusula SQL IN parametrizada.
 * @param {Array} values - Valores que ocuparán los placeholders.
 * @returns {string} Lista de signos de interrogación separados por coma.
 */
function buildInClause(values) {
  return values.map(() => "?").join(", ");
}

/**
 * Normaliza una respuesta para comparaciones sin acentos, espacios extremos ni mayúsculas.
 * @param {string} value - Respuesta original de la base de datos o del usuario.
 * @returns {string} Respuesta normalizada para deduplicación o validación.
 */
function normalizeRespuesta(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Elimina respuestas equivalentes conservando la primera forma legible encontrada.
 * @param {string[]} values - Respuestas candidatas.
 * @returns {string[]} Lista sin duplicados semánticos simples.
 */
function uniqueRespuestas(values) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const normalized = normalizeRespuesta(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(value);
  }

  return output;
}

/**
 * Calcula las respuestas aceptadas para una fila, incluyendo alternativas numéricas cuando existen.
 * @param {string} respuesta - Respuesta principal almacenada.
 * @param {string|null} respuestaAlt - Respuesta alternativa opcional.
 * @param {string} categoriaOrigen - Tabla/categoría de la que proviene la fila.
 * @returns {string[]} Respuestas válidas para evaluar texto escrito.
 */
function getAcceptedAnswersForRow(respuesta, respuestaAlt, categoriaOrigen) {
  const base = String(respuesta || "").trim();
  if (!base) return [];
  if (categoriaOrigen !== "numeros") return [base];

  const alt = String(respuestaAlt || "").trim();
  return uniqueRespuestas([base, alt].filter(Boolean));
}

/**
 * Genera preguntas de opción múltiple desde una o varias categorías y dificultades.
 * @param {import("express").Request} req - Petición con categoria, dificultad y limit opcionales en query.
 * @param {import("express").Response} res - Respuesta con media, respuesta correcta y opciones mezcladas.
 * @returns {Promise<void>} Envía el arreglo de preguntas o un error HTTP.
 */
questionsRouter.get("/multiple-choice", async (req, res) => {
  try {
    const categorias = await getAndValidateCategorias(req, res);
    if (!categorias) return;

    const dificultades = getAndValidateDificultades(req, res);
    if (!dificultades) return;
    const limit = getValidatedLimit(req);
    const source = await buildUnionSubquery(categorias);
    const dificultadesIn = buildInClause(dificultades);

    // 1) Traer N correctas aleatorias de las categorias/dificultades
    const [correctRows] = await pool.query(
      `SELECT id, media_tipo, media_fuente, respuesta, dificultad
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

      let wrongOptions = uniqueRespuestas(sameLevelWrongRows.map(r => r.respuesta));

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

        wrongOptions = uniqueRespuestas(
          wrongOptions.concat(fallbackWrongRows.map(r => r.respuesta))
        );
      }

      const correctAnswer = row.respuesta;
      const opciones = shuffle(uniqueRespuestas([correctAnswer, ...wrongOptions])).slice(0, 4);
      questions.push({
        media_tipo: row.media_tipo,
        media_fuente: row.media_fuente,
        media_ruta: row.media_fuente,
        correcta: correctAnswer,
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
 * Genera preguntas de verdadero/falso mezclando coincidencias correctas y distractores.
 * @param {import("express").Request} req - Petición con categoria, dificultad y limit opcionales en query.
 * @param {import("express").Response} res - Respuesta con media, texto de pregunta y bandera es_verdadero.
 * @returns {Promise<void>} Envía el arreglo de preguntas o un error HTTP.
 */
questionsRouter.get("/true-false", async (req, res) => {
  try {
    const categorias = await getAndValidateCategorias(req, res);
    if (!categorias) return;

    const dificultades = getAndValidateDificultades(req, res);
    if (!dificultades) return;
    const limit = getValidatedLimit(req);
    const source = await buildUnionSubquery(categorias);
    const dificultadesIn = buildInClause(dificultades);

    // Tomamos "limit" señas base (cada una con su respuesta correcta)
    const [rows] = await pool.query(
      `SELECT id, media_tipo, media_fuente, respuesta
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
          media_tipo: row.media_tipo,
          media_fuente: row.media_fuente,
          media_ruta: row.media_fuente,
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
          media_tipo: row.media_tipo,
          media_fuente: row.media_fuente,
          media_ruta: row.media_fuente,
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
 * Genera ejercicios de escritura con respuestas aceptadas, incluyendo alternativas para números.
 * @param {import("express").Request} req - Petición con categoria, dificultad y limit opcionales en query.
 * @param {import("express").Response} res - Respuesta con media, pregunta, respuesta mostrada y respuestas aceptadas.
 * @returns {Promise<void>} Envía el arreglo de preguntas o un error HTTP.
 */
questionsRouter.get("/text-input", async (req, res) => {
  try {
    const categorias = await getAndValidateCategorias(req, res);
    if (!categorias) return;

    const dificultades = getAndValidateDificultades(req, res);
    if (!dificultades) return;
    const limit = getValidatedLimit(req);
    const source = await buildUnionSubquery(categorias);
    const dificultadesIn = buildInClause(dificultades);

    const [rows] = await pool.query(
      `SELECT media_tipo, media_fuente, respuesta, respuesta_alt, categoria_origen
       FROM (${source}) AS src
       WHERE dificultad IN (${dificultadesIn})
       ORDER BY RAND()
       LIMIT ?`,
      [...dificultades, limit]
    );

    const questions = rows.map((r) => {
      const correctas = getAcceptedAnswersForRow(r.respuesta, r.respuesta_alt, r.categoria_origen);
      const correcta = correctas[Math.floor(Math.random() * correctas.length)] || r.respuesta;

      return {
        media_tipo: r.media_tipo,
        media_fuente: r.media_fuente,
        media_ruta: r.media_fuente,
        pregunta: "Escribe la palabra que representa la seña:",
        correcta,
        correctas
      };
    });

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno en text-input" });
  }
});

/**
 * Mezcla opciones de respuesta sin alterar el arreglo original.
 * @param {Array} arr - Opciones que se presentarán en orden aleatorio.
 * @returns {Array} Nueva lista mezclada.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
