/*
 * Nombre: rewards.js
 * Descripción: Centraliza animaciones visuales de recompensas y cofres.
 * Módulo: Frontend / Recompensas
 */
const INFINITE_HEARTS_LOTTIE_SRC = 'https://lottie.host/dc359c7b-1c91-4240-8bbb-6875c10d318e/VneDkjaLX8.lottie';
const CHEST_LOTTIE_SRC = 'https://lottie.host/15b01aa0-3b82-4c5b-8486-512610b7a096/IYvwrrdLyw.lottie';
const ROUTE_CHEST_GEM_DELAY_SECONDS = 1.35;
const ROUTE_CHEST_GEM_DELAY_VARIANCE_SECONDS = 0.45;

function ensureDotLottieScript() {
  if (document.querySelector('script[data-dotlottie-wc]')) return;

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.14/dist/dotlottie-wc.js';
  script.type = 'module';
  script.dataset.dotlottieWc = 'true';
  document.head.appendChild(script);
}

function showFullscreenLottieAnimation(src, durationMs) {
  // Centraliza la creación del overlay para evitar repetir estilos entre recompensas.
  ensureDotLottieScript();

  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'background: transparent',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'z-index: 9999',
    'pointer-events: none',
  ].join(';');

  const animation = document.createElement('dotlottie-wc');
  animation.setAttribute('src', src);
  animation.setAttribute('autoplay', '');
  animation.setAttribute('loop', '');
  animation.style.cssText = [
    'position: absolute',
    'inset: 0',
    'width: 100vw',
    'height: 100vh',
  ].join(';');

  overlay.appendChild(animation);
  document.body.appendChild(overlay);
  window.setTimeout(() => overlay.remove(), durationMs);
}

function showSingleHeartAnimation() {
  showFullscreenLottieAnimation(
    'https://lottie.host/b379f4f2-26d2-4b45-b598-5091c88a7d5b/PgQYbpR93Z.lottie',
    3100,
  );
}

function showHeartBundleAnimation() {
  showFullscreenLottieAnimation(
    'https://lottie.host/a256014a-c9f6-4f21-8f89-ddb63470231b/4NIEBugTnF.lottie',
    4000,
  );
}

function showInfiniteHeartsAnimation() {
  showFullscreenLottieAnimation(INFINITE_HEARTS_LOTTIE_SRC, 9000);
}

function getGemCounterCenter() {
  const gemsPill = document.querySelector('.status-pill--gems');
  if (gemsPill) {
    const rect = gemsPill.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  return { x: window.innerWidth - 120, y: 42 };
}

function showRouteChestAnimation() {
  ensureDotLottieScript();

  const target = getGemCounterCenter();
  const overlay = document.createElement('div');
  overlay.className = 'route-chest-reward';

  const animation = document.createElement('dotlottie-wc');
  animation.className = 'route-chest-reward__video';
  animation.setAttribute('src', CHEST_LOTTIE_SRC);
  animation.setAttribute('autoplay', '');
  animation.setAttribute('loop', '');
  animation.setAttribute('aria-hidden', 'true');

  const burst = document.createElement('div');
  burst.className = 'route-chest-reward__burst';

  for (let i = 0; i < 20; i += 1) {
    const gem = document.createElement('span');
    gem.className = 'route-chest-reward__gem material-symbols-outlined';
    gem.textContent = 'diamond';
    gem.style.setProperty('--start-x', `${Math.random() * 220 - 110}px`);
    gem.style.setProperty('--start-y', `${Math.random() * -155 - 25}px`);
    gem.style.setProperty('--target-x', `${target.x - window.innerWidth / 2}px`);
    gem.style.setProperty('--target-y', `${target.y - window.innerHeight / 2}px`);
    gem.style.setProperty(
      '--delay',
      `${ROUTE_CHEST_GEM_DELAY_SECONDS + Math.random() * ROUTE_CHEST_GEM_DELAY_VARIANCE_SECONDS}s`,
    );
    gem.style.setProperty('--size', `${22 + Math.random() * 18}px`);
    burst.appendChild(gem);
  }

  overlay.appendChild(animation);
  overlay.appendChild(burst);
  document.body.appendChild(overlay);
  window.setTimeout(() => overlay.remove(), 4200);
}

export { showSingleHeartAnimation, showHeartBundleAnimation, showInfiniteHeartsAnimation, showRouteChestAnimation };
