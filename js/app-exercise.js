/**
 * @file app-exercise.js
 * @description Controla la pantalla de ejercicios de un nivel: carga su configuración, obtiene preguntas del backend, renderiza medios y respuestas, evalúa intentos, actualiza vidas, registra tiempo y marca el nivel como completado.
 * @module Ejercicios
 */
import { loadState, loseLifeGlobal } from "./game-state.js";
import { updateInfiniteHeartsIndicator } from "./infinite-hearts-indicator.js";
import { addTimeInvested, completeLevel } from "./api-user.js";
import { loadSession } from "./user-session.js";

console.log("✅ app-exercise.js cargado");

/**
 * Lee el parámetro level de la URL para decidir qué lección debe cargarse.
 * @returns {number} Número de nivel solicitado o 1 cuando el parámetro no es válido.
 */
function getLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const level = Number(params.get("level") || 1);
  return Number.isFinite(level) ? level : 1;
}

/**
 * Importa dinámicamente la configuración del nivel indicado.
 * @param {number} level - Número de nivel cuyo archivo de configuración se cargará.
 * @returns {Promise<Object>} Configuración pedagógica y mezcla de ejercicios del nivel.
 */
async function loadLevelConfig(level) {
  const mod = await import(`./level-config/level-${level}.js`);
  return mod.LEVEL_CONFIG;
}

/**
 * Mezcla una lista sin modificar el arreglo original para variar el orden de preguntas.
 * @param {Array} arr - Elementos que se desean reordenar aleatoriamente.
 * @returns {Array} Nueva lista con los mismos elementos en orden aleatorio.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Solicita preguntas al backend agregando filtros como parámetros de consulta.
 * @param {string} path - Endpoint de preguntas que se consultará.
 * @param {Object} params - Parámetros de categoría, dificultad y límite.
 * @returns {Promise<Array|Object>} Datos JSON devueltos por el endpoint solicitado.
 */
async function fetchJSON(path, params) {
  const base = window.API_BASE || window.location.origin;
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${path} ${res.status}: ${txt}`);
  }
  return await res.json();
}

/**
 * Extrae las categorías de vocabulario desde configuraciones nuevas o heredadas del nivel.
 * @param {Object} cfg - Configuración del nivel cargada dinámicamente.
 * @returns {string[]} Lista de categorías que debe solicitar el ejercicio.
 */
function resolveCategorias(cfg) {
  if (Array.isArray(cfg.categorias) && cfg.categorias.length > 0) {
    return cfg.categorias;
  }
  if (Array.isArray(cfg.categoria) && cfg.categoria.length > 0) {
    return cfg.categoria;
  }
  if (typeof cfg.categoria === "string" && cfg.categoria.trim()) {
    return cfg.categoria
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}



const CATEGORIA_ALIASES = {
  // compatibilidad hacia atrás
  palabras_comunes: "palabrascomunes",
};

/**
 * Limpia categorías vacías y traduce alias heredados al nombre esperado por la API.
 * @param {string[]} categorias - Categorías declaradas por la configuración del nivel.
 * @returns {string[]} Categorías normalizadas para enviarlas al backend.
 */
function normalizeCategorias(categorias) {
  return categorias
    .map((categoria) => String(categoria || "").trim())
    .filter(Boolean)
    .map((categoria) => CATEGORIA_ALIASES[categoria] || categoria);
}

/**
 * Muestra un mensaje y redirige al usuario cuando no puede continuar en el ejercicio.
 * @param {Object} options - Opciones del modal que explican el motivo de salida.
 * @param {string} target - Página a la que se redirigirá al cerrar el aviso.
 * @returns {void} No devuelve valor; cambia window.location cuando corresponde.
 */
function redirectAfterModal(options, target = "index.html") {
  const modal = window.showLsmModal?.({
    ...options,
    onClose: () => {
      window.location.href = target;
    },
  });

  if (!modal) {
    window.location.href = target;
  }
}

/**
 * Normaliza la dificultad del nivel a una lista de enteros positivos únicos.
 * @param {Object} cfg - Configuración del nivel con dificultad única o múltiple.
 * @returns {number[]} Dificultades válidas que se enviarán al backend.
 */
function resolveDificultades(cfg) {
  if (Array.isArray(cfg.dificultad)) {
    return [...new Set(
      cfg.dificultad
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d > 0)
    )];
  }

  const unica = Number(cfg.dificultad);
  if (Number.isInteger(unica) && unica > 0) {
    return [unica];
  }

  return [];
}


(async function main() {
  let level;
  let cfg;
  let btnSkip;
  let btnCheck;
  let feedback;
  let actionsEl;
  let optionsEl;
  let promptText;
  let promptSubtitle;
  let imgEl;
  let videoEl;
  let youtubeEl;
  let btnRestartMedia;
  let progressFill;
  let progressValue;
  let livesEl;
  let livesCountEl;
  const CHECK_LABEL = 'Comprobar<span class="material-symbols-outlined">arrow_forward</span>';
  let state;
  let levelStartedAt;
  let timeReported = false;
  let currentMediaType = "imagen";
  let currentMediaSource = "";

  try {
    level = getLevelFromURL();
    cfg = await loadLevelConfig(level);

  console.log("📌 Config cargada:", cfg);
  document.title = `Nivel ${cfg.level}`;

  document.getElementById("btnExit").onclick = async () => {
    await reportTimeSpent();
    window.location.href = "index.html";
  };

  btnSkip = document.getElementById("btnSkip");
  btnCheck = document.getElementById("btnCheck");
  feedback = document.getElementById("feedback");
  actionsEl = document.getElementById("exerciseActions");
  optionsEl = document.getElementById("options");
  promptText = document.getElementById("promptText");
  promptSubtitle = document.getElementById("promptSubtitle");
  imgEl = document.getElementById("mediaImg");
  videoEl = document.getElementById("mediaVideo");
  youtubeEl = document.getElementById("mediaYoutube");
  btnRestartMedia = document.getElementById("btnRestartMedia");
  progressFill = document.getElementById("progressFill");
  progressValue = document.getElementById("progressValue");
  livesEl = document.getElementById("lives");
  livesCountEl = document.getElementById("livesCount");

  videoEl.autoplay = true;
  videoEl.loop = true;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.controls = false;
  videoEl.setAttribute("controlsList", "nodownload noplaybackrate nofullscreen noremoteplayback");
  videoEl.disablePictureInPicture = true;

  btnRestartMedia?.addEventListener("click", restartMedia);

  const global = await loadState();
  if (Number(level) > Number(global.level)) {
    redirectAfterModal({ message: `¡Nivel Bloqueado! Tu nivel actual es ${global.level}. Completa las lecciones anteriores para desbloquear el nivel ${level}.` });
    return;
  }

  state = {
    index: 0,
    lives: global.lives,
    maxLives: global.maxLives,
    infiniteHeartsActive: global.infiniteHeartsActive,
    infiniteHeartsRemainingSeconds: global.infiniteHeartsRemainingSeconds,
    locked: false,
    selected: null,
    queue: [],
  };
  levelStartedAt = Date.now();

  updateLives();

    const mix = cfg.mix || { multiple_choice: 1 };
    const categorias = normalizeCategorias(resolveCategorias(cfg));
    if (categorias.length === 0) {
      redirectAfterModal({ title: '¡Ups!', message: 'No se encontró contenido para este nivel. Intenta más tarde.' });
      return;
    }

    const dificultades = resolveDificultades(cfg);
    if (dificultades.length === 0) {
      redirectAfterModal({ title: '¡Ups!', message: 'La dificultad de este nivel no está configurada correctamente.' });
      return;
    }

    const categoriasParam = categorias.join(",");
    const dificultadParam = dificultades.join(",");
    const [mc, vf, tx] = await Promise.all([
      mix.multiple_choice
        ? fetchJSON("/api/questions/multiple-choice", {
            categoria: categoriasParam,
            dificultad: dificultadParam,
            limit: mix.multiple_choice,
          })
        : Promise.resolve([]),
      mix.true_false
        ? fetchJSON("/api/questions/true-false", {
            categoria: categoriasParam,
            dificultad: dificultadParam,
            limit: mix.true_false,
          })
        : Promise.resolve([]),
      mix.text_input
        ? fetchJSON("/api/questions/text-input", {
            categoria: categoriasParam,
            dificultad: dificultadParam,
            limit: mix.text_input,
          })
        : Promise.resolve([]),
    ]);

    state.queue = shuffle([
      ...mc.map((q) => ({ tipo: "multiple_choice", ...q })),
      ...vf.map((q) => ({ tipo: "true_false", ...q })),
      ...tx.map((q) => ({ tipo: "text_input", ...q })),
    ]);

    if (state.queue.length === 0) {
      redirectAfterModal({ title: '¡Ups!', message: 'No hay preguntas disponibles para este nivel por ahora.' });
      return;
    }

    btnSkip.onclick = () => {
      if (state.locked) return;
      nextQuestion();
    };

    btnCheck.onclick = async () => {
      if (state.locked) return;

      const q = state.queue[state.index];
      const ok = evaluateCurrent(q);

      state.locked = true;
      if (ok) {
        showFeedback(true, buildFeedback(q, true));
      } else {
        const updated = await loseLifeGlobal(1);
        state.lives = updated.lives;
        state.infiniteHeartsActive = updated.infiniteHeartsActive;
        state.infiniteHeartsRemainingSeconds = updated.infiniteHeartsRemainingSeconds;
        updateLives();
        showFeedback(false, buildFeedback(q, false));

        if (state.lives <= 0) {
          window.showLsmModal?.({ message: '¡Sin corazones! Vuelve a intentarlo cuando recuperes vidas.' });
          return endLevel(false);
        }
      }

    };

    renderCurrent();
  } catch (err) {
    console.error("Error al cargar el nivel:", err);
    redirectAfterModal({ title: '¡Ups!', message: `No se pudo cargar el nivel. Detalle: ${err.message}` });
    return;
  }

  /**
   * Renderiza la pregunta actual con su medio, instrucciones y controles adecuados al tipo de ejercicio.
   * @returns {void} No devuelve valor; actualiza el DOM de la plantilla de ejercicios.
   */
  function renderCurrent() {
    state.selected = null;
    state.locked = false;
    feedback.style.display = "none";
    feedback.innerHTML = "";
    btnCheck.innerHTML = CHECK_LABEL;
    actionsEl?.classList.remove("is-hidden");

    const total = state.queue.length;
    updateProgress(Math.round((state.index / total) * 100));

    const q = state.queue[state.index];
    const mediaFuente = q.media_fuente || q.media_ruta || "";
    const mediaTipo = inferMediaType(q.media_tipo, mediaFuente);
    renderMedia(mediaTipo, mediaFuente);

    optionsEl.innerHTML = "";
    optionsEl.classList.remove("exercise__options--text");
    delete optionsEl.dataset.count;

    if (q.tipo === "multiple_choice") {
      promptText.textContent = q.pregunta || "¿Qué significa esta seña?";
      promptSubtitle.textContent = "Selecciona la traducción correcta";

      const opciones = (q.opciones || []).slice(0, 4);
      optionsEl.dataset.count = String(opciones.length);

      opciones.forEach((op) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "option option--multiple";
        b.innerHTML = `<span class="option__label">${op}</span>`;
        b.onclick = () => selectOption(op, b);
        optionsEl.appendChild(b);
      });
      return;
    }

    if (q.tipo === "true_false") {
      promptText.textContent = q.pregunta || "¿Esta seña significa 'Hola'?";
      promptSubtitle.textContent = "Selecciona la opción correcta";

      [
        { label: "Verdadero", icon: "check_circle", modifier: "option--true-false-true" },
        { label: "Falso", icon: "cancel", modifier: "option--true-false-false" },
      ].forEach(({ label, icon, modifier }) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `option ${modifier}`;
        b.innerHTML = `
          <span class="option__icon-wrap">
            <span class="material-symbols-outlined">${icon}</span>
          </span>
          <span class="option__label">${label}</span>
        `;
        b.onclick = () => selectOption(label, b);
        optionsEl.appendChild(b);
      });
      return;
    }

    if (q.tipo === "text_input") {
      promptText.textContent = q.pregunta || "Escribe la palabra que representa la seña:";
      promptSubtitle.textContent = "Escribe tu respuesta en español";
      optionsEl.classList.add("exercise__options--text");
      optionsEl.innerHTML = '<input id="answerInput" class="text-input" type="text" placeholder="Escribe tu respuesta aquí..." autocomplete="off" />';
      document.getElementById("answerInput")?.focus();
      return;
    }

    promptText.textContent = "Tipo de ejercicio no soportado";
    promptSubtitle.textContent = "";
  }

  /**
   * Registra la opción elegida y actualiza el estado visual de selección.
   * @param {string} value - Respuesta seleccionada por el usuario.
   * @param {HTMLElement} element - Botón que debe marcarse como seleccionado.
   * @returns {void} No devuelve valor; guarda la selección en el estado local.
   */
  function selectOption(value, element) {
    if (state.locked) return;
    state.selected = value;
    [...optionsEl.children].forEach((node) => node.classList.remove("option--selected"));
    element.classList.add("option--selected");
  }

  /**
   * Evalúa la respuesta del usuario según el tipo de pregunta actual.
   * @param {Object} q - Pregunta activa con respuesta correcta y metadatos de tipo.
   * @returns {boolean} true cuando la respuesta coincide con la solución esperada.
   */
  function evaluateCurrent(q) {
    if (q.tipo === "multiple_choice") {
      if (!state.selected) return false;
      return state.selected === q.correcta;
    }

    if (q.tipo === "true_false") {
      if (!state.selected) return false;
      const pickedTrue = state.selected === "Verdadero";
      return pickedTrue === Boolean(q.es_verdadero);
    }

    if (q.tipo === "text_input") {
      const input = document.getElementById("answerInput");
      const userText = (input?.value || "").trim().toLowerCase();
      const correctas = Array.isArray(q.correctas) && q.correctas.length
        ? q.correctas
        : [q.correcta];
      const normalizedCorrectas = correctas
        .map((v) => String(v || "").trim().toLowerCase())
        .filter(Boolean);
      return Boolean(userText) && normalizedCorrectas.includes(userText);
    }

    return false;
  }

  /**
   * Avanza al siguiente ejercicio o termina el nivel cuando la cola se agotó.
   * @returns {void} No devuelve valor; cambia el índice actual o finaliza la lección.
   */
  function nextQuestion() {
    state.index++;
    if (state.index >= state.queue.length) return endLevel(true);
    renderCurrent();
  }

  /**
   * Cierra la sesión de práctica, reporta tiempo y registra avance si el nivel se completó.
   * @param {boolean} completed - Indica si el usuario respondió toda la cola antes de quedarse sin vidas.
   * @returns {Promise<void>} No devuelve valor; redirige a la ruta principal o muestra un aviso.
   */
  async function endLevel(completed) {
    updateProgress(100);
    await reportTimeSpent();

    if (completed) {
      const session = loadSession();
      if (session?.usuario) {
        try {
          await completeLevel(session.usuario, level);
        } catch (err) {
          console.warn("No se pudo actualizar avance de nivel:", err.message);
        }
      }

      window.location.href = "index.html";
      return;
    }

    redirectAfterModal({ message: '¡Sin corazones! Vuelve a intentarlo cuando recuperes vidas.' });
  }

  /**
   * Envía al backend el tiempo transcurrido desde que inició el nivel evitando reportes duplicados.
   * @returns {Promise<void>} No devuelve valor; persiste segundos de práctica cuando hay sesión activa.
   */
  async function reportTimeSpent() {
    if (timeReported) return;
    const session = loadSession();
    if (!session?.usuario) return;

    const elapsedSeconds = Math.floor((Date.now() - levelStartedAt) / 1000);
    if (elapsedSeconds <= 0) return;

    try {
      await addTimeInvested(session.usuario, elapsedSeconds);
      timeReported = true;
    } catch (err) {
      console.warn("No se pudo guardar el tiempo invertido:", err.message);
    }
  }

  /**
   * Sincroniza el contador de vidas de la pantalla con el estado local y el indicador de corazones infinitos.
   * @returns {void} No devuelve valor; actualiza texto, dataset y animación del contador.
   */
  function updateLives() {
    livesEl.dataset.lives = String(state.lives);
    if (livesCountEl) livesCountEl.textContent = state.infiniteHeartsActive ? "" : String(state.lives);
    updateInfiniteHeartsIndicator(livesEl, state);
  }

  /**
   * Actualiza la barra y etiqueta porcentual de progreso del nivel.
   * @param {number} value - Porcentaje completado que debe mostrarse.
   * @returns {void} No devuelve valor; cambia ancho y texto de progreso.
   */
  function updateProgress(value) {
    progressFill.style.width = `${value}%`;
    if (progressValue) progressValue.textContent = `${value}%`;
  }

  /**
   * Construye el contenido de retroalimentación para respuestas correctas o incorrectas.
   * @param {Object} question - Pregunta evaluada de la que se obtendrá la solución si falló.
   * @param {boolean} ok - Resultado de la evaluación de la respuesta.
   * @returns {Object} Título, mensaje e icono que se mostrarán al usuario.
   */
  function buildFeedback(question, ok) {
    if (ok) {
      return {
        title: "¡Excelente!",
        message: "Has identificado correctamente la seña.",
        icon: "check",
      };
    }

    const answer = Array.isArray(question.correctas) && question.correctas.length
      ? question.correctas.join('" o "')
      : (question.correcta ?? (question.es_verdadero ? "Verdadero" : "Falso"));
    return {
      title: "Respuesta incorrecta",
      message: `Solución: <strong>${answer}</strong>`,
      icon: "close",
    };
  }

  /**
   * Muestra la tarjeta de retroalimentación y prepara el botón para continuar.
   * @param {boolean} ok - Define el estilo visual de éxito o error.
   * @param {Object} config - Textos e icono que explican el resultado.
   * @returns {void} No devuelve valor; reemplaza las acciones por el panel de feedback.
   */
  function showFeedback(ok, config) {
    feedback.style.display = "block";
    actionsEl?.classList.add("is-hidden");
    feedback.className = `exercise__feedback ${ok ? "feedback--ok" : "feedback--bad"}`;
    feedback.innerHTML = `
      <div class="feedback__inner">
        <div class="feedback__summary">
          <div class="feedback__icon">
            <span class="material-symbols-outlined">${config.icon}</span>
          </div>
          <div>
            <h3 class="feedback__title">${config.title}</h3>
            <p class="feedback__message">${config.message}</p>
          </div>
        </div>
        <button type="button" class="feedback__button" id="feedbackContinue">
          Continuar
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    `;

    document.getElementById("feedbackContinue")?.addEventListener("click", nextQuestion, { once: true });
  }

  /**
   * Determina si el recurso de la pregunta debe mostrarse como imagen, video local o YouTube.
   * @param {string} rawType - Tipo declarado por la base de datos, si existe.
   * @param {string} source - URL o ruta del recurso multimedia.
   * @returns {string} Tipo normalizado: imagen, video o youtube.
   */
  function inferMediaType(rawType, source) {
    const type = String(rawType || "").toLowerCase();
    if (type === "youtube" || type === "video" || type === "imagen") {
      return type;
    }

    if (isYouTubeUrl(source)) return "youtube";
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(source)) return "video";
    return "imagen";
  }

  /**
   * Presenta el recurso multimedia de la pregunta en el reproductor correspondiente.
   * @param {string} type - Tipo normalizado del medio.
   * @param {string} source - URL o ruta que se asignará al elemento visual.
   * @returns {void} No devuelve valor; muestra imagen, video o iframe.
   */
  function renderMedia(type, source) {
    currentMediaType = type;
    currentMediaSource = source;
    hideAllMedia();

    if (type === "youtube") {
      const embedUrl = toYouTubeEmbedURL(source);
      if (!embedUrl) {
        imgEl.style.display = "block";
        imgEl.src = "";
        imgEl.alt = "Video de YouTube no válido";
        return;
      }

      youtubeEl.style.display = "block";
      youtubeEl.src = `${embedUrl}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${extractYouTubeId(source)}&playsinline=1`;
      btnRestartMedia.style.display = "inline-flex";
      return;
    }

    if (type === "video") {
      videoEl.style.display = "block";
      videoEl.src = source;
      videoEl.play().catch(() => {});
      btnRestartMedia.style.display = "inline-flex";
      return;
    }

    imgEl.style.display = "block";
    imgEl.src = source;
    btnRestartMedia.style.display = "none";
  }

  /**
   * Oculta y reinicia todos los reproductores para evitar audio, video o iframes residuales.
   * @returns {void} No devuelve valor; limpia los elementos multimedia.
   */
  function hideAllMedia() {
    imgEl.style.display = "none";
    videoEl.style.display = "none";
    youtubeEl.style.display = "none";
    btnRestartMedia.style.display = "none";
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
    youtubeEl.src = "";
  }

  /**
   * Reinicia el video local o recarga el iframe de YouTube de la pregunta actual.
   * @returns {void} No devuelve valor; vuelve a reproducir el recurso cuando aplica.
   */
  function restartMedia() {
    if (currentMediaType === "video") {
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {});
      return;
    }

    if (currentMediaType === "youtube") {
      const embedUrl = toYouTubeEmbedURL(currentMediaSource);
      const id = extractYouTubeId(currentMediaSource);
      if (!embedUrl || !id) return;
      youtubeEl.src = `${embedUrl}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${id}&playsinline=1`;
    }
  }

  /**
   * Verifica si una cadena apunta a un dominio de YouTube compatible.
   * @param {string} url - URL candidata de la pregunta.
   * @returns {boolean} true si la URL pertenece a youtube.com o youtu.be.
   */
  function isYouTubeUrl(url) {
    return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(String(url || ""));
  }

  /**
   * Convierte enlaces públicos de YouTube en una URL de inserción para iframe.
   * @param {string} url - Enlace original guardado en la pregunta.
   * @returns {string} URL embed válida o cadena vacía si no puede convertirse.
   */
  function toYouTubeEmbedURL(url) {
    try {
      const candidate = String(url || "").trim();
      if (!candidate) return "";
      const normalized = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
      const parsed = new URL(normalized);
      const host = parsed.hostname.toLowerCase();

      if (host === "youtu.be") {
        const id = parsed.pathname.split("/").filter(Boolean)[0];
        return id ? `https://www.youtube.com/embed/${id}` : "";
      }

      if (host.endsWith("youtube.com")) {
        if (parsed.pathname.startsWith("/embed/")) {
          const id = parsed.pathname.split("/")[2];
          return id ? `https://www.youtube.com/embed/${id}` : "";
        }

        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : "";
      }

      return "";
    } catch {
      return "";
    }
  }

  /**
   * Extrae el identificador de video desde una URL de YouTube normalizada.
   * @param {string} url - Enlace de YouTube asociado al ejercicio.
   * @returns {string} ID del video o cadena vacía si el enlace es inválido.
   */
  function extractYouTubeId(url) {
    const embedUrl = toYouTubeEmbedURL(url);
    if (!embedUrl) return "";
    return embedUrl.split("/").pop() || "";
  }
})();
