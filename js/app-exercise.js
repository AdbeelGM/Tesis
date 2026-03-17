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

  document.title = `Nivel ${cfg.level}`;
  document.getElementById("btnExit").onclick = () => (window.location.href = "index.html");

  const btnSkip = document.getElementById("btnSkip");
  const btnCheck = document.getElementById("btnCheck");
  const feedback = document.getElementById("feedback");
  const optionsEl = document.getElementById("options");
  const promptText = document.getElementById("promptText");
  const imgEl = document.getElementById("mediaImg");
  const videoEl = document.getElementById("mediaVideo");
  const progressFill = document.getElementById("progressFill");
  const progressPct = document.getElementById("progressPct");
  const livesEl = document.getElementById("lives");
  const livesCount = document.getElementById("livesCount");

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
    return (window.location.href = "index.html");
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
      showFeedback(true, q);
    } else {
      const updated = await loseLifeGlobal(1);
      state.lives = updated.lives;
      updateLives();
      showFeedback(false, q);

      if (state.lives <= 0) {
        alert("❌ Sin vidas");
        return endLevel(false);
      }
    }

    btnCheck.innerHTML = `CONTINUAR <span class="material-symbols-outlined">arrow_forward</span>`;
    btnCheck.dataset.mode = "next";
  };

  renderCurrent();

  function renderCurrent() {
    state.selected = null;
    state.locked = false;
    feedback.style.display = "none";
    document.body.classList.remove("feedback--ok", "feedback--bad");
    btnCheck.innerHTML = `COMPROBAR <span class="material-symbols-outlined">arrow_forward</span>`;
    btnCheck.dataset.mode = "check";

    const total = state.queue.length;
    const pct = Math.round((state.index / total) * 100);
    progressFill.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;

    const q = state.queue[state.index];
    optionsEl.dataset.type = q.tipo;

    const kickerByType = {
      multiple_choice: "Select the correct translation",
      true_false: "Selecciona la opción correcta",
      text_input: "Selecciona la opción correcta",
    };
    const kickerEl = document.querySelector(".exercise__kicker");
    if (kickerEl) kickerEl.textContent = kickerByType[q.tipo] || "Selecciona la opción correcta";

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

    if (q.tipo === "multiple_choice") {
      promptText.textContent = q.pregunta || "What does this sign mean?";
      (q.opciones || []).forEach((op) => {
        const b = document.createElement("button");
        b.className = "option";
        b.innerHTML = `<span>${op}</span>`;
        b.onclick = () => selectOption(op, b);
        optionsEl.appendChild(b);
      });
      return;
    }

    if (q.tipo === "true_false") {
      promptText.textContent = q.pregunta || "¿Esta seña significa \"Hola\"?";
      [
        { label: "Verdadero", icon: "check" },
        { label: "Falso", icon: "close" },
      ].forEach(({ label, icon }) => {
        const b = document.createElement("button");
        b.className = "option";
        b.dataset.value = label;
        b.innerHTML = `<span class="option__iconWrap material-symbols-outlined">${icon}</span><span>${label}</span>`;
        b.onclick = () => selectOption(label, b);
        optionsEl.appendChild(b);
      });
      return;
    }

    if (q.tipo === "text_input") {
      promptText.textContent = q.pregunta || "Escribe la palabra que representa la seña:";
      optionsEl.innerHTML = `<input id="answerInput" class="text-input" type="text" placeholder="Escribe tu respuesta aquí..." autocomplete="off" />`;
      return;
    }

    promptText.textContent = "Tipo de ejercicio no soportado";
  }

  function selectOption(value, element) {
    if (state.locked) return;
    state.selected = value;
    [...optionsEl.children].forEach((x) => x.classList.remove("option--selected"));
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
      return userText && userText === correct;
    }

    return false;
  }

  function nextQuestion() {
    state.index++;
    if (state.index >= state.queue.length) return endLevel(true);
    renderCurrent();
  }

  async function endLevel(completed) {
    progressFill.style.width = "100%";
    if (progressPct) progressPct.textContent = "100%";

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
    const hearts = livesEl.querySelectorAll(".heart");
    hearts.forEach((h, i) => {
      h.classList.toggle("heart--on", i < state.lives);
      h.classList.toggle("heart--off", i >= state.lives);
    });
    if (livesCount) livesCount.textContent = String(state.lives);
  }

  function getCorrectAnswer(q) {
    if (q.tipo === "true_false") return q.es_verdadero ? "Verdadero" : "Falso";
    return q.correcta || "-";
  }

  function showFeedback(ok, q) {
    feedback.style.display = "flex";
    document.body.classList.remove("feedback--ok", "feedback--bad");
    document.body.classList.add(ok ? "feedback--ok" : "feedback--bad");

    if (ok) {
      feedback.innerHTML = `
        <div class="feedback__left">
          <div class="feedback__icon material-symbols-outlined">check</div>
          <div>
            <h4 class="feedback__title">¡Excelente trabajo!</h4>
            <p class="feedback__desc">Has identificado correctamente la seña.</p>
          </div>
        </div>
      `;
      return;
    }

    feedback.innerHTML = `
      <div class="feedback__left">
        <div class="feedback__icon material-symbols-outlined">close</div>
        <div>
          <h4 class="feedback__title">¡Casi lo tienes!</h4>
          <p class="feedback__desc">La respuesta correcta era: <strong>${getCorrectAnswer(q)}</strong></p>
        </div>
      </div>
    `;
  }
})();
