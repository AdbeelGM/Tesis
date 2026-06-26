/*
 * Nombre: text-input.js
 * Descripción: Contiene estilos o lógica de soporte para text-input.
 * Módulo: Proyecto LSM Gamificada
 */
export function runTextInput(cfg) {
  return new Promise(async (resolve) => {
    const state = {
      index: 0,
      total: cfg.totalPreguntas ?? 1,
      questions: [],
      locked: false,
    };

    // UI
    const btnSkip = document.getElementById("btnSkip");
    const btnCheck = document.getElementById("btnCheck");
    const feedback = document.getElementById("feedback");
    const optionsEl = document.getElementById("options");
    const promptText = document.getElementById("promptText");
    const imgEl = document.getElementById("mediaImg");
    const videoEl = document.getElementById("mediaVideo");
    const progressFill = document.getElementById("progressFill");

    // 1) Cargar preguntas
    try {
      state.questions = await fetchQuestionsText(cfg);
      console.log("🟦 TextInput loaded:", state.questions);
    } catch (e) {
      console.error(e.message || "Error cargando Text Input");
      return resolve();
    }

    if (!Array.isArray(state.questions) || state.questions.length === 0) {
      console.warn("No hay preguntas de Text Input.");
      return resolve();
    }

    // IMPORTANTÍSIMO: total real
    state.total = Math.min(state.total, state.questions.length);

    // 2) Handlers (limpia los anteriores)
    btnSkip.onclick = () => {
      if (state.locked) return;
      next();
    };

    btnCheck.onclick = () => {
      // ✅ modo next primero
      if (btnCheck.dataset.mode === "next") return next();
      if (state.locked) return;

      const q = state.questions[state.index];
      const input = document.getElementById("answerInput");
      const userText = normalizeAnswer(input?.value || "");
      const correctas = Array.isArray(q.correctas) && q.correctas.length
        ? q.correctas
        : [q.correcta];
      const normalizedCorrectas = correctas
        .map((v) => normalizeAnswer(v))
        .filter(Boolean);

      state.locked = true;

      const ok = Boolean(userText) && normalizedCorrectas.includes(userText);
      const respuestaEsperada = correctas.join('" o "');
      feedback.style.display = "block";
      feedback.className = "exercise__feedback " + (ok ? "feedback--ok" : "feedback--bad");
      feedback.textContent = ok ? "¡Correcto!" : `Incorrecto. Era: "${respuestaEsperada}"`;

      btnCheck.textContent = "Siguiente";
      btnCheck.dataset.mode = "next";
    };

    // 3) Render inicial
    render();

    function render() {
      state.locked = false;
      feedback.style.display = "none";
      btnCheck.textContent = "Comprobar";
      btnCheck.dataset.mode = "check";
      optionsEl.classList.remove("exercise__options--text");

      const q = state.questions[state.index];
      if (!q) return resolve();

      // Progreso
      const pct = Math.round((state.index / state.total) * 100);
      progressFill.style.width = `${pct}%`;

      // Prompt
      promptText.textContent = q.pregunta || "Escribe la palabra que representa la seña:";

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

      // Input
      optionsEl.classList.add("exercise__options--text");
      optionsEl.innerHTML = `
        <input id="answerInput" class="text-input" type="text" placeholder="Escribe aquí..." autocomplete="off" />
      `;
    }

    function next() {
      state.index++;
      if (state.index >= state.total) {
        progressFill.style.width = "100%";
        return resolve(); // ✅ ahora sí termina el bloque
      }
      render();
    }
  });
}

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function fetchQuestionsText(cfg) {
  // ✅ igual que Multiple Choice: NO hardcode localhost
  const API_BASE = window.API_BASE || window.location.origin;

  const url = new URL("/api/questions/text-input", API_BASE);
  url.searchParams.set("categoria", cfg.categoria);
  url.searchParams.set("dificultad", String(cfg.dificultad));
  url.searchParams.set("limit", String(cfg.totalPreguntas ?? 1));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`TEXT ${res.status}: ${txt}`);
  }
  return await res.json();
}
