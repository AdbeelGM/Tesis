export function runMultipleChoice(cfg) {
  return new Promise(async (resolve) => {
    const state = {
      index: 0,
      total: cfg.totalPreguntas ?? 1,
      selected: null,
      locked: false,
      lives: 3,
      questions: [],
    };

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

    // ✅ cargar preguntas
    try {
      state.questions = await fetchQuestionsMC(cfg);
    } catch (e) {
      alert(e.message || "Error cargando preguntas");
      return resolve(); // termina el bloque para no romper todo
    }

    // ✅ eventos (IMPORTANTE: limpiamos handlers anteriores)
    btnSkip.onclick = () => {
      if (state.locked) return;
      next();
    };

    btnCheck.onclick = () => {
  // ✅ si está en modo next, avanza SIEMPRE
  if (btnCheck.dataset.mode === "next") {
    return next();
  }

  // ✅ solo en modo comprobar exigimos selección y que no esté locked
  if (!state.selected || state.locked) return;

  state.locked = true;
  const q = state.questions[state.index];
  const isCorrect = state.selected === q.correcta;

  if (isCorrect) {
    showFeedback(true, "¡Correcto!");
  } else {
    state.lives--;
    updateLives();
    showFeedback(false, `Incorrecto. La respuesta correcta era: "${q.correcta}"`);
    if (state.lives <= 0) {
      alert("❌ Sin vidas");
      return resolve();
    }
  }

  btnCheck.textContent = "Siguiente";
  btnCheck.dataset.mode = "next";
};


    render();

    function render() {
      state.selected = null;
      state.locked = false;
      feedback.style.display = "none";
      btnCheck.textContent = "Comprobar";
      btnCheck.dataset.mode = "check";

      const q = state.questions[state.index];

      const pct = Math.round((state.index / state.total) * 100);
      progressFill.style.width = `${pct}%`;

      promptText.textContent = q.pregunta || "Esta seña representa la palabra:";

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
      (q.opciones || []).forEach((op) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.type = "button";
        btn.textContent = op;

        btn.onclick = () => {
          if (state.locked) return;
          state.selected = op;
          [...optionsEl.children].forEach(x => x.classList.remove("option--selected"));
          btn.classList.add("option--selected");
        };

        optionsEl.appendChild(btn);
      });
    }

    function next() {
      state.index++;
      if (state.index >= state.total) {
        progressFill.style.width = "100%";
        return resolve(); // ✅ termina este bloque (y ahora sí el await espera)
      }
      render();
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
  });
}

async function fetchQuestionsMC(cfg) {
  const API_BASE = window.API_BASE || window.location.origin;

  const url = new URL("/api/questions/multiple-choice", API_BASE);
  url.searchParams.set("categoria", cfg.categoria);
  url.searchParams.set("dificultad", String(cfg.dificultad));
  url.searchParams.set("limit", String(cfg.totalPreguntas ?? 1));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Error cargando preguntas (${res.status}): ${txt}`);
  }
  return await res.json();
}
