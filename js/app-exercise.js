import { loadState, loseLifeGlobal, setLives } from "./game-state.js";

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

  // salir
  document.getElementById("btnExit").onclick = () => (window.location.href = "index.html");

  // UI refs
  const btnSkip = document.getElementById("btnSkip");
  const btnCheck = document.getElementById("btnCheck");
  const feedback = document.getElementById("feedback");
  const optionsEl = document.getElementById("options");
  const promptText = document.getElementById("promptText");
  const imgEl = document.getElementById("mediaImg");
  const videoEl = document.getElementById("mediaVideo");
  const progressFill = document.getElementById("progressFill");
  const livesEl = document.getElementById("lives");

  // ✅ cargar vidas globales
  const global = loadState();

  // Estado del nivel (pero vidas vienen del global)
  const state = {
    index: 0,
    lives: global.lives,        // ✅ GLOBAL
    maxLives: global.maxLives,  // ✅ por si quieres usarlo después
    locked: false,
    selected: null,
    queue: [],
  };

  // ✅ pintar corazones al iniciar (según vidas actuales)
  updateLives();

  // 1) Cargar preguntas por tipo
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

  // 2) Normalizar a un formato común con "tipo"
  const queue = [
    ...mc.map((q) => ({ tipo: "multiple_choice", ...q })),
    ...vf.map((q) => ({ tipo: "true_false", ...q })),
    ...tx.map((q) => ({ tipo: "text_input", ...q })),
  ];

  state.queue = shuffle(queue);

  if (state.queue.length === 0) {
    alert("No hay preguntas para este nivel.");
    return (window.location.href = "index.html");
  }

  // botones
  btnSkip.onclick = () => {
    if (state.locked) return;
    nextQuestion();
  };

  btnCheck.onclick = () => {
    // next primero
    if (btnCheck.dataset.mode === "next") return nextQuestion();

    // en check validamos según tipo
    if (state.locked) return;

    const q = state.queue[state.index];
    const ok = evaluateCurrent(q);

    state.locked = true;
    if (ok) {
      showFeedback(true, "¡Correcto!");
    } else {
      // ✅ RESTA VIDA GLOBAL
      const updated = loseLifeGlobal(1);
      state.lives = updated.lives;

      updateLives();
      showFeedback(false, "Incorrecto");

      if (state.lives <= 0) {
        alert("❌ Sin vidas");
        return endLevel(false);
      }
    }

    btnCheck.textContent = "Siguiente";
    btnCheck.dataset.mode = "next";
  };

  // render 1ra
  renderCurrent();

  // --------- funciones ---------

  function renderCurrent() {
    state.selected = null;
    state.locked = false;
    feedback.style.display = "none";
    btnCheck.textContent = "Comprobar";
    btnCheck.dataset.mode = "check";

    const total = state.queue.length;
    const pct = Math.round((state.index / total) * 100);
    progressFill.style.width = `${pct}%`;

    const q = state.queue[state.index];

    // Media
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

    // Render por tipo
    optionsEl.innerHTML = "";

    if (q.tipo === "multiple_choice") {
      promptText.textContent = q.pregunta || "Esta seña representa la palabra:";
      (q.opciones || []).forEach((op) => {
        const b = document.createElement("button");
        b.className = "option";
        b.textContent = op;
        b.onclick = () => {
          if (state.locked) return;
          state.selected = op;
          [...optionsEl.children].forEach((x) => x.classList.remove("option--selected"));
          b.classList.add("option--selected");
        };
        optionsEl.appendChild(b);
      });
      return;
    }

    if (q.tipo === "true_false") {
      promptText.textContent = q.pregunta || "¿Verdadero o falso?";
      ["Verdadero", "Falso"].forEach((op) => {
        const b = document.createElement("button");
        b.className = "option";
        b.textContent = op;
        b.onclick = () => {
          if (state.locked) return;
          state.selected = op;
          [...optionsEl.children].forEach((x) => x.classList.remove("option--selected"));
          b.classList.add("option--selected");
        };
        optionsEl.appendChild(b);
      });
      return;
    }

    if (q.tipo === "text_input") {
      promptText.textContent = q.pregunta || "Escribe la palabra:";
      optionsEl.innerHTML = `<input id="answerInput" class="text-input" type="text" placeholder="Escribe aquí..." autocomplete="off" />`;
      return;
    }

    promptText.textContent = "Tipo de ejercicio no soportado";
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

  function endLevel(completed) {
    progressFill.style.width = "100%";

    // ✅ guardamos por si acaso (aunque ya se guarda al fallar)
    setLives(state.lives);

    alert(completed ? "✅ Nivel completado" : "❌ Nivel terminado sin vidas");
    window.location.href = "index.html";
  }

  function updateLives() {
    const hearts = livesEl.querySelectorAll(".heart");
    hearts.forEach((h, i) => {
      h.classList.toggle("heart--on", i < state.lives);
      h.classList.toggle("heart--off", i >= state.lives);
    });
  }

  function showFeedback(ok, text) {
    feedback.style.display = "block";
    feedback.className = "exercise__feedback " + (ok ? "feedback--ok" : "feedback--bad");
    feedback.textContent = text;
  }
})();
