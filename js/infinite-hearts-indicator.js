const DOT_LOTTIE_SCRIPT_ID = "dotlottie-wc-loader";
const DOT_LOTTIE_SCRIPT_SRC = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.14/dist/dotlottie-wc.js";
const INFINITE_HEARTS_LOTTIE_SRC = "https://lottie.host/cb3a8682-d9a0-44b5-a3e8-306e83250ed0/6oQnGEP5ZN.lottie";

export function ensureInfiniteHeartsPlayer() {
  if (document.getElementById(DOT_LOTTIE_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = DOT_LOTTIE_SCRIPT_ID;
  script.src = DOT_LOTTIE_SCRIPT_SRC;
  script.type = "module";
  document.head.appendChild(script);
}

export function updateInfiniteHeartsIndicator(container, state) {
  if (!container) return;

  const active = Boolean(state?.infiniteHeartsActive);
  container.classList.toggle("has-infinite-hearts", active);
  container.setAttribute(
    "aria-label",
    active ? "Corazones infinitos activos" : "Vidas restantes"
  );

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

  const remainingSeconds = Number(state?.infiniteHeartsRemainingSeconds) || 0;
  if (remainingSeconds > 0) {
    container.title = `Corazones infinitos activos: ${formatDuration(remainingSeconds)} restantes`;
  } else {
    container.title = "Corazones infinitos activos";
  }
}

function formatDuration(seconds) {
  const totalHours = Math.max(1, Math.ceil(Number(seconds) / 3600));
  if (totalHours < 24) return `${totalHours}h`;

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}
