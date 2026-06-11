import { loadState, loseLifeGlobal } from "./game-state.js";
import { updateInfiniteHeartsIndicator } from "./infinite-hearts-indicator.js";
import { addTimeInvested, completeLevel } from "./api-user.js";
import { loadSession } from "./user-session.js";

console.log("✅ app-exercise.js cargado");

function getLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const level = Number(params.get("level") || 1);
  return Number.isFinite(level) ? level : 1;
}

async function loadLevelConfig(level) {
  const mod = await import(`./level-config/level-${level}.js`);
  return mod.LEVEL_CONFIG;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

function normalizeCategorias(categorias) {
  return categorias
    .map((categoria) => String(categoria || "").trim())
    .filter(Boolean)
    .map((categoria) => CATEGORIA_ALIASES[categoria] || categoria);
}

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
  if (Number(global.level) !== Number(level)) {
    console.warn(`No tienes acceso al nivel ${level}. Tu nivel actual es ${global.level}.`);
    window.location.href = "index.html";
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
      console.error("Config inválida: define al menos una categoría.");
      window.location.href = "index.html";
      return;
    }

    const dificultades = resolveDificultades(cfg);
    if (dificultades.length === 0) {
      console.error("Config inválida: dificultad debe ser un entero positivo o un arreglo de enteros positivos.");
      window.location.href = "index.html";
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
      console.warn("No hay preguntas para este nivel.");
      window.location.href = "index.html";
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
          console.info("Nivel terminado sin vidas.");
          return endLevel(false);
        }
      }

    };

    renderCurrent();
  } catch (err) {
    console.error("Error al cargar el nivel:", err);
    console.error(`No se pudo cargar el nivel. Revisa la configuración. Detalle: ${err.message}`);
    window.location.href = "index.html";
    return;
  }

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

  function selectOption(value, element) {
    if (state.locked) return;
    state.selected = value;
    [...optionsEl.children].forEach((node) => node.classList.remove("option--selected"));
    element.classList.add("option--selected");
  }

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

  function nextQuestion() {
    state.index++;
    if (state.index >= state.queue.length) return endLevel(true);
    renderCurrent();
  }

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

    console.info("Nivel terminado sin vidas.");
    window.location.href = "index.html";
  }

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

  function updateLives() {
    livesEl.dataset.lives = String(state.lives);
    if (livesCountEl) livesCountEl.textContent = state.infiniteHeartsActive ? "" : String(state.lives);
    updateInfiniteHeartsIndicator(livesEl, state);
  }

  function updateProgress(value) {
    progressFill.style.width = `${value}%`;
    if (progressValue) progressValue.textContent = `${value}%`;
  }

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

  function inferMediaType(rawType, source) {
    const type = String(rawType || "").toLowerCase();
    if (type === "youtube" || type === "video" || type === "imagen") {
      return type;
    }

    if (isYouTubeUrl(source)) return "youtube";
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(source)) return "video";
    return "imagen";
  }

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

  function isYouTubeUrl(url) {
    return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(String(url || ""));
  }

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

  function extractYouTubeId(url) {
    const embedUrl = toYouTubeEmbedURL(url);
    if (!embedUrl) return "";
    return embedUrl.split("/").pop() || "";
  }
})();
