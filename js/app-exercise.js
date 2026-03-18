import { loadState, loseLifeGlobal } from "./game-state.js";
import { completeLevel } from "./api-user.js";
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

(async function main() {
  const level = getLevelFromURL();
  const cfg = await loadLevelConfig(level);

  console.log("📌 Config cargada:", cfg);
  document.title = `Nivel ${cfg.level}`;

  const CHECK_LABEL = 'Comprobar<span class="material-symbols-outlined">arrow_forward</span>';
  const NEXT_LABEL = 'Siguiente<span class="material-symbols-outlined">arrow_forward</span>';

  document.getElementById("btnExit").onclick = () => (window.location.href = "index.html");

  const btnSkip = document.getElementById("btnSkip");
  const btnCheck = document.getElementById("btnCheck");
  const feedback = document.getElementById("feedback");
  const optionsEl = document.getElementById("options");
  const promptText = document.getElementById("promptText");
  const promptSubtitle = document.getElementById("promptSubtitle");
  const imgEl = document.getElementById("mediaImg");
  const videoEl = document.getElementById("mediaVideo");
  const progressFill = document.getElementById("progressFill");
  const progressValue = document.getElementById("progressValue");
  const livesEl = document.getElementById("lives");
  const livesCountEl = document.getElementById("livesCount");

  const global = await loadState();
  if (Number(global.level) !== Number(level)) {
    alert(`No tienes acceso al nivel ${level}. Tu nivel actual es ${global.level}.`);
    window.location.href = "index.html";
    return;
  }

  const state = {
    index: 0,
    lives: global.lives,
    maxLives: global.maxLives,
    locked: false,
    selected: null,
    queue: [],
  };

  updateLives();

  const mix = cfg.mix || { multiple_choice: 1 };
  const [mc, vf, tx] = await Promise.all([
    mix.multiple_choice
      ? fetchJSON("/api/questions/multiple-choice", {
          categoria: cfg.categoria,
          dificultad: cfg.dificultad,
          limit: mix.multiple_choice,
        })
      : Promise.resolve([]),
    mix.true_false
      ? fetchJSON("/api/questions/true-false", {
          categoria: cfg.categoria,
          dificultad: cfg.dificultad,
          limit: mix.true_false,
        })
      : Promise.resolve([]),
    mix.text_input
      ? fetchJSON("/api/questions/text-input", {
          categoria: cfg.categoria,
          dificultad: cfg.dificultad,
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
    alert("No hay preguntas para este nivel.");
    window.location.href = "index.html";
    return;
  }

  btnSkip.onclick = () => {
    if (state.locked) return;
    nextQuestion();
  };

  btnCheck.onclick = async () => {
    if (btnCheck.dataset.mode === "next") return nextQuestion();
    if (state.locked) return;

    const q = state.queue[state.index];
    const ok = evaluateCurrent(q);

    state.locked = true;
    if (ok) {
      showFeedback(true, buildFeedback(q, true));
    } else {
      const updated = await loseLifeGlobal(1);
      state.lives = updated.lives;
      updateLives();
      showFeedback(false, buildFeedback(q, false));

      if (state.lives <= 0) {
        alert("❌ Sin vidas");
        return endLevel(false);
      }
    }

    btnCheck.innerHTML = NEXT_LABEL;
    btnCheck.dataset.mode = "next";
  };

  renderCurrent();

  function renderCurrent() {
    state.selected = null;
    state.locked = false;
    feedback.style.display = "none";
    feedback.innerHTML = "";
    btnCheck.innerHTML = CHECK_LABEL;
    btnCheck.dataset.mode = "check";

    const total = state.queue.length;
    updateProgress(Math.round((state.index / total) * 100));

    const q = state.queue[state.index];
    const ruta = q.media_ruta || "";
    const isVideo = /\.(mp4|webm|ogg)$/i.test(ruta);

    if (isVideo) {
      imgEl.style.display = "none";
      videoEl.style.display = "block";
      videoEl.src = ruta;
    } else {
      videoEl.style.display = "none";
      imgEl.style.display = "block";
      imgEl.src = ruta;
    }

    optionsEl.innerHTML = "";
    optionsEl.className = "exercise__options";

    if (q.tipo === "multiple_choice") {
      promptText.textContent = q.pregunta || "What does this sign mean?";
      promptSubtitle.textContent = "Select the correct translation";

      (q.opciones || []).forEach((op) => {
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
      promptSubtitle.textContent = "Selecciona la opción correcta";
      optionsEl.classList.add("exercise__options--text-input");
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
      const correct = (q.correcta || "").trim().toLowerCase();
      return Boolean(userText) && userText === correct;
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

    if (completed) {
      const session = loadSession();
      if (session?.usuario) {
        try {
          await completeLevel(session.usuario, level);
        } catch (err) {
          console.warn("No se pudo actualizar avance de nivel:", err.message);
        }
      }
    }

    alert(completed ? "✅ Nivel completado" : "❌ Nivel terminado sin vidas");
    window.location.href = "index.html";
  }

  function updateLives() {
    livesEl.dataset.lives = String(state.lives);
    if (livesCountEl) livesCountEl.textContent = String(state.lives);
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

    const answer = question.correcta ?? (question.es_verdadero ? "Verdadero" : "Falso");
    return {
      title: "Respuesta incorrecta",
      message: `Solución: <strong>${answer}</strong>`,
      icon: "close",
    };
  }

  function showFeedback(ok, config) {
    feedback.style.display = "block";
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
})();
