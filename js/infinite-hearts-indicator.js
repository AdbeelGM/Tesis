/**
 * @file infinite-hearts-indicator.js
 * @description Renderiza el indicador visual de corazones infinitos en los contadores de vidas, cargando el reproductor DotLottie solo cuando el beneficio está activo.
 * @module EstadoDelJuego
 */
const DOT_LOTTIE_SCRIPT_ID = "dotlottie-wc-loader";
const DOT_LOTTIE_SCRIPT_SRC = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.14/dist/dotlottie-wc.js";
const INFINITE_HEARTS_LOTTIE_SRC = "https://lottie.host/5d0296e4-75bf-4ea6-a91d-1a4ab9229cb4/jKw6JA4dDx.lottie";

/**
 * Inserta una sola vez el componente web DotLottie necesario para mostrar el poder de corazones infinitos.
 * @returns {void} No devuelve valor; agrega el script al documento si aún no existe.
 */
export function ensureInfiniteHeartsPlayer() {
  if (document.getElementById(DOT_LOTTIE_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = DOT_LOTTIE_SCRIPT_ID;
  script.src = DOT_LOTTIE_SCRIPT_SRC;
  script.type = "module";
  document.head.appendChild(script);
}

/**
 * Actualiza el contador de vidas para reflejar si los corazones infinitos están activos.
 * @param {HTMLElement|null} container - Contenedor visual de vidas donde se añadirá o retirará el indicador.
 * @param {Object} state - Estado del jugador con la bandera de corazones infinitos.
 * @returns {void} No devuelve valor; modifica clases, accesibilidad y contenido del contenedor.
 */
export function updateInfiniteHeartsIndicator(container, state) {
  if (!container) return;

  const active = Boolean(state?.infiniteHeartsActive);
  container.classList.toggle("has-infinite-hearts", active);
  container.setAttribute(
    "aria-label",
    active ? "Corazones infinitos activos" : "Vidas restantes"
  );
  container.removeAttribute("title");

  let indicator = container.querySelector(".infinite-hearts-indicator");

  if (!active) {
    indicator?.remove();
    return;
  }

  ensureInfiniteHeartsPlayer();

  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "infinite-hearts-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.innerHTML = `
      <dotlottie-wc
        src="${INFINITE_HEARTS_LOTTIE_SRC}"
        autoplay
        loop
      ></dotlottie-wc>
    `;
    container.prepend(indicator);
  }
}
