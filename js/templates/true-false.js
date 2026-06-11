export function runTrueFalse(cfg) {
  return new Promise(async (resolve) => {
    const state = {
      index: 0,
      total: cfg.totalPreguntas ?? 1,
      selected: null,
      locked: false,
      questions: [],
    };

    const btnSkip = document.getElementById("btnSkip");
    const btnCheck = document.getElementById("btnCheck");
    const feedback = document.getElementById("feedback");
    const optionsEl = document.getElementById("options");
    const promptText = document.getElementById("promptText");
    const imgEl = document.getElementById("mediaImg");
    const videoEl = document.getElementById("mediaVideo");
    const progressFill = document.getElementById("progressFill");

    // ✅ cargar preguntas
    try {
      state.questions = await fetchQuestionsTF(cfg);
    } catch (e) {
      console.error(e.message || "Error cargando VF");
      return resolve(); // ahora SÍ existe
    }

    // ajustar total a lo que realmente llegó
    state.total = Math.min(state.total, state.questions.length);
    if (state.total === 0) return resolve();

    btnSkip.onclick = () => next();

    btnCheck.onclick = () => {
      if (btnCheck.dataset.mode === "next") return next();
      if (!state.selected || state.locked) return;

      state.locked = true;
      const q = state.questions[state.index];
      const isCorrect = (state.selected === "Verdadero") === Boolean(q.es_verdadero);

      feedback.style.display = "block";
      feedback.textContent = isCorrect ? "¡Correcto!" : "Incorrecto";

      btnCheck.textContent = "Siguiente";
      btnCheck.dataset.mode = "next";
    };

    render();

    function render() {
      state.locked = false;
      state.selected = null;
      feedback.style.display = "none";
      btnCheck.textContent = "Comprobar";
      btnCheck.dataset.mode = "check";

      const q = state.questions[state.index];
      promptText.textContent = q.pregunta;

      const ruta = q.media_ruta || "";
      const isVideo = /\.(mp4|webm|ogg)$/i.test(ruta);
      imgEl.style.display = isVideo ? "none" : "block";
      videoEl.style.display = isVideo ? "block" : "none";
      (isVideo ? videoEl : imgEl).src = ruta;

      optionsEl.innerHTML = "";
      ["Verdadero", "Falso"].forEach(op => {
        const b = document.createElement("button");
        b.className = "option";
        b.textContent = op;
        b.onclick = () => {
          state.selected = op;
          [...optionsEl.children].forEach(x => x.classList.remove("option--selected"));
          b.classList.add("option--selected");
        };
        optionsEl.appendChild(b);
      });

      progressFill.style.width = `${Math.round((state.index / state.total) * 100)}%`;
    }

    function next() {
      state.index++;
      if (state.index >= state.total) {
        progressFill.style.width = "100%";
        return resolve(); // ✅ ahora sí termina el bloque VF
      }
      render();
    }
  });
}

async function fetchQuestionsTF(cfg) {
  const API_BASE = window.location.origin;
  const url = new URL("/api/questions/true-false", API_BASE);
  url.searchParams.set("categoria", cfg.categoria);
  url.searchParams.set("dificultad", String(cfg.dificultad));
  url.searchParams.set("limit", String(cfg.totalPreguntas ?? 1));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Error cargando VF");
  return await res.json();
}
