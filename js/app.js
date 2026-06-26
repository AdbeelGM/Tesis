/*
 * Nombre: app.js
 * Descripción: Orquesta la ruta de aprendizaje, tienda, perfil y recompensas visuales del usuario.
 * Módulo: Frontend / Aplicación principal
 */
import { loadSession, clearSession } from './user-session.js';
import { refreshStatusBar } from './statusbar.js';
import { purchaseStoreItemGlobal, updateProfilePhotoGlobal } from './game-state.js';

const LOGIN_URL = 'login.html';
const XP_BASE_REQUIREMENT = 120;
const INFINITE_HEARTS_LOTTIE_SRC = 'https://lottie.host/dc359c7b-1c91-4240-8bbb-6875c10d318e/VneDkjaLX8.lottie';
const CHEST_LOTTIE_SRC = 'https://lottie.host/15b01aa0-3b82-4c5b-8486-512610b7a096/IYvwrrdLyw.lottie';
const ROUTE_CHEST_GEM_DELAY_SECONDS = 1.35;
const ROUTE_CHEST_GEM_DELAY_VARIANCE_SECONDS = 0.45;
const DEFAULT_PROFILE_AVATAR_SRC = 'img/avatar.png';

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

function bindSectionChestClicks(root = document) {
  const chests = [...root.querySelectorAll('[data-section-chest]')];
  const currentLevel = Number(window.currentUserState?.level) || 1;

  chests.forEach((chest) => {
    const lastLevel = Number(chest.dataset.sectionLastLevel) || 0;
    const unlocked = currentLevel > lastLevel;

    chest.disabled = false;
    chest.setAttribute('aria-disabled', String(!unlocked));
    chest.classList.toggle('route__section-chest--locked', !unlocked);
    chest.classList.toggle('route__section-chest--ready', unlocked);
    chest.setAttribute('aria-label', unlocked ? 'Abrir cofre de sección' : 'Cofre de sección bloqueado');

    if (chest.dataset.boundChest === 'true') return;
    chest.addEventListener('click', () => {
      if (chest.getAttribute('aria-disabled') === 'true') {
        window.showLsmModal?.({ message: '¡Cofre Bloqueado! Completa todos los niveles de esta sección para abrirlo.' });
        return;
      }

      showRouteChestAnimation();
    });
    chest.dataset.boundChest = 'true';
  });
}

function xpNeededToAdvance(accountLevel) {
  const level = Math.max(1, Number(accountLevel) || 1);
  return Math.round(XP_BASE_REQUIREMENT + (level * 32) + (Math.pow(level, 1.4) * 14));
}

function getExperienceProgress(totalXp) {
  let xp = Math.max(0, Number(totalXp) || 0);
  let accountLevel = 1;
  let required = xpNeededToAdvance(accountLevel);

  while (xp >= required) {
    xp -= required;
    accountLevel += 1;
    required = xpNeededToAdvance(accountLevel);
  }

  const percent = Math.max(0, Math.min(100, Math.round((xp / required) * 100)));
  return {
    accountLevel,
    currentXpInLevel: xp,
    neededXpForNext: required,
    percent,
  };
}

const LEARN_UNITS = [
  {
    eyebrow: 'Sección 1',
    title: 'Primeros pasos',
    subtitle: 'Aprende el abecedario, los números y los colores en LSM.',
    levels: [1, 2, 3, 4, 5],
    offsets: [90, -80, 0, 100, -60],
  },
  {
    eyebrow: 'Sección 2',
    title: 'Hablando con otros',
    subtitle: 'Practica saludos, familia, pronombres y expresiones del día a día.',
    levels: [6, 7, 8, 9, 10],
    offsets: [-70, 85, -15, 95, -55],
  },
  {
    eyebrow: 'Sección 3',
    title: 'El mundo y la vida cotidiana',
    subtitle: 'Explora lugares, transportes, tecnología y más en LSM.',
    levels: [11, 12, 13, 14, 15],
    offsets: [80, -90, 10, 100, -65],
  },
];

function renderLevelPath(unit, unitIndex) {
  return `
    <section class="route__path" data-unit-index="${unitIndex}">
      <svg class="route__snake" viewBox="0 0 100 600" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50,0 C80,100 20,200 50,300 C80,400 20,500 50,600"></path>
      </svg>

      ${unit.levels.map((level, index) => `
        <div class="level-item" style="--offset-x: ${unit.offsets[index] || 0}px">
          <button class="level-node" data-level="${level}" type="button"></button>
        </div>
      `).join('')}

      <div class="level-item level-item--section-chest" style="--offset-x: 0px">
        <button
          class="level-node route__section-chest"
          data-section-chest="${unitIndex}"
          data-section-last-level="${unit.levels[unit.levels.length - 1]}"
          type="button"
        >
          <span class="material-symbols-outlined">featured_seasonal_and_gifts</span>
        </button>
      </div>
    </section>
  `;
}

function renderLearnUnitHeader(unit = LEARN_UNITS[0]) {
  return `
    <section class="route__unit-card route__unit-card--sticky" data-dynamic-unit-card aria-live="polite">
      <div class="route__unit-copy">
        <span class="route__eyebrow" data-dynamic-unit-eyebrow>${unit.eyebrow}</span>
        <h1 class="route__title" data-dynamic-unit-title>${unit.title}</h1>
        <p class="route__subtitle" data-dynamic-unit-subtitle>${unit.subtitle}</p>
      </div>
      <button class="route__guide btn-hover-elevate btn-active-press" type="button">Guide</button>
      <div class="route__orb route__orb--big"></div>
      <div class="route__orb route__orb--small"></div>
    </section>
  `;
}

function renderLearnView() {
  return `
    <div class="route__learn">
      ${renderLearnUnitHeader()}
      <div class="route__sections">
        ${LEARN_UNITS.map((unit, index) => `
          ${renderLevelPath(unit, index)}
          ${index < LEARN_UNITS.length - 1 ? `<p class="route__transition-text">${LEARN_UNITS[index + 1].eyebrow} · ${LEARN_UNITS[index + 1].title}</p>` : ''}
        `).join('')}
      </div>
    </div>
  `;
}


function setDynamicUnitHeader(root, unitIndex) {
  const unit = LEARN_UNITS[unitIndex] || LEARN_UNITS[0];
  const card = root.querySelector('[data-dynamic-unit-card]');
  const eyebrow = root.querySelector('[data-dynamic-unit-eyebrow]');
  const title = root.querySelector('[data-dynamic-unit-title]');
  const subtitle = root.querySelector('[data-dynamic-unit-subtitle]');

  if (!card || !unit || card.dataset.activeUnitIndex === String(unitIndex)) return;

  card.dataset.activeUnitIndex = String(unitIndex);
  card.classList.add('route__unit-card--changing');

  if (eyebrow) eyebrow.textContent = unit.eyebrow;
  if (title) title.textContent = unit.title;
  if (subtitle) subtitle.textContent = unit.subtitle;

  window.setTimeout(() => card.classList.remove('route__unit-card--changing'), 180);
}

function initializeDynamicUnitHeader(root) {
  const sections = [...root.querySelectorAll('.route__path[data-unit-index]')];
  const card = root.querySelector('[data-dynamic-unit-card]');
  if (sections.length === 0 || !card) return null;

  let frame = null;
  const getSwitchLine = () => {
    const rootRect = root.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const stickyOffset = Math.max(16, cardRect.top - rootRect.top);
    return rootRect.top + stickyOffset + cardRect.height + 24;
  };

  const updateActiveUnit = () => {
    frame = null;
    const switchLine = getSwitchLine();
    const activeSection = sections.reduce((active, section) => {
      const sectionTop = section.getBoundingClientRect().top;
      return sectionTop <= switchLine ? section : active;
    }, sections[0]);

    setDynamicUnitHeader(root, Number(activeSection.dataset.unitIndex) || 0);
  };

  const requestUpdate = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(updateActiveUnit);
  };

  root.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateActiveUnit();

  return () => {
    root.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}

function renderStoreView() {
  return `
    <section class="store">
      <div class="store__container">
        <div class="store__banner">
          <div class="store__banner-content">
            <div>
              <h1 class="store__title">Tienda LSM Quest</h1>
              <p class="store__subtitle">Recarga tus vidas y sigue aprendiendo!</p>
            </div>
            <div class="store__counter">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">favorite</span>
              <span id="store-lives-label">0 / 5</span>
            </div>
          </div>
          <div class="store__orb store__orb--big"></div>
          <div class="store__orb store__orb--small"></div>
        </div>

        <div class="store__grid">
          <article class="product-card btn-active-press">
            <div class="product-card__icon-wrap">
              <span class="material-symbols-outlined product-card__icon" style="font-variation-settings: 'FILL' 1;">favorite</span>
            </div>
            <h3 class="product-card__title">Corazón individual</h3>
            <p class="product-card__description">Una vida para mantener tu racha</p>
            <button class="product-card__buy btn-hover-elevate btn-active-press" data-product-id="single_heart" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>100 gemas</span>
            </button>
          </article>

          <article class="product-card product-card--featured btn-active-press">
            <span class="product-card__badge">Más popular</span>
            <div class="product-card__icon-wrap product-card__icon-wrap--cluster">
              <span class="material-symbols-outlined product-card__icon product-card__icon--small top-left" style="font-variation-settings: 'FILL' 1;">favorite</span>
              <span class="material-symbols-outlined product-card__icon" style="font-variation-settings: 'FILL' 1;">favorite</span>
              <span class="material-symbols-outlined product-card__icon product-card__icon--small bottom-right" style="font-variation-settings: 'FILL' 1;">favorite</span>
            </div>
            <h3 class="product-card__title">Paquete de corazones</h3>
            <p class="product-card__description">¡Recarga completa! Obtén 5 corazones al instante</p>
            <button class="product-card__buy btn-3d-orange btn-hover-elevate btn-active-press" data-product-id="heart_bundle" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>450 gemas</span>
            </button>
          </article>

          <article class="product-card btn-active-press">
            <span class="product-card__badge product-card__badge--teal">Oferta especial</span>
            <div class="product-card__icon-wrap product-card__icon-wrap--teal">
              <span class="material-symbols-outlined product-card__icon product-card__icon--teal">all_inclusive</span>
              <span class="product-card__mini-heart material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">favorite</span>
            </div>
            <h3 class="product-card__title">Corazones infinitos</h3>
            <p class="product-card__description">24 horas de aprendizaje ilimitado</p>
            <button class="product-card__buy btn-hover-elevate btn-active-press" data-product-id="infinite_hearts_24h" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>950 gemas</span>
            </button>
          </article>
        </div>
        <p id="store-infinite-status" style="text-align:center; margin-top: 14px; color: #0f766e; font-weight: 700;"></p>
      </div>
    </section>
  `;
}

function renderProfileView() {
  return `
    <section class="profile-view">
      <div class="profile-layout">
        <article class="profile-banner card-hover-lift">
          <div class="profile-banner__bg profile-banner__bg--grid"></div>
          <div class="profile-banner__bg profile-banner__bg--orb-top"></div>
          <div class="profile-banner__bg profile-banner__bg--orb-bottom"></div>

          <div class="profile-banner__content">
              <div class="profile-avatar-wrap">
                <div class="profile-avatar-ring">
                  <img id="profile-avatar" class="profile-avatar" src="${DEFAULT_PROFILE_AVATAR_SRC}" alt="Foto de perfil">
                </div>
              <span class="profile-pro-badge">PRO</span>
            </div>

            <div class="profile-main-info">
              <div class="profile-header-row">
                <div>
                  <div class="profile-name-row">
                    <h1 id="profile-name" class="profile-name">Usuario</h1>
                    <span class="material-symbols-outlined profile-verified" style="font-variation-settings: 'FILL' 1;">verified</span>
                  </div>
                  <p id="profile-joined" class="profile-meta">
                    <span class="material-symbols-outlined">calendar_today</span>
                    Se unió recientemente
                  </p>
                </div>

                <button id="profile-edit-btn" class="profile-edit-btn btn-active-press" type="button">
                  <span class="material-symbols-outlined">edit</span>
                  Cambiar foto
                </button>
                <input id="profile-photo-input" type="file" accept="image/*" hidden>
              </div>

              <div class="profile-progress-wrap">
                <div class="profile-progress-head">
                  <span class="profile-progress-title">
                    <span class="material-symbols-outlined">auto_awesome</span>
                    Progreso del viaje
                  </span>
                  <span id="profile-progress-percent" class="profile-progress-percent">0%</span>
                </div>

                <div class="profile-progress-track">
                  <div id="profile-progress-fill" class="profile-progress-fill progress-fill" style="width: 0%;">
                    <span class="profile-progress-dot"></span>
                  </div>
                </div>

                <div id="profile-progress-meta" class="profile-progress-meta">
                  <span>Nivel 1 (0 XP)</span>
                  <span>Progreso de aprendizaje</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <section class="profile-stats-grid">
          <div class="profile-stats-list">
            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--orange">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
              </div>
              <h3 id="profile-streak">0 días</h3>
              <p>Racha diaria</p>
            </article>

            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--yellow">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">diamond</span>
              </div>
              <h3 id="profile-gems">0</h3>
              <p>Gemas</p>
            </article>

            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--teal">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">task_alt</span>
              </div>
              <h3 id="profile-lessons">0</h3>
              <p>Lecciones terminadas</p>
            </article>
          </div>

          <article class="profile-quests-card card-hover-lift">
            <h4>Tiempo invertido</h4>
            <strong id="profile-time-hours">0d 0h</strong>
          </article>
        </section>
      </div>
    </section>
  `;
}

function mountView(viewName, mountNode) {
  const views = {
    aprender: renderLearnView,
    tienda: renderStoreView,
    perfil: renderProfileView,
  };

  mountNode.dynamicUnitHeaderCleanup?.();
  mountNode.dynamicUnitHeaderCleanup = null;

  const renderer = views[viewName] || views.aprender;
  mountNode.innerHTML = renderer();

  if (viewName === 'aprender') {
    mountNode.dynamicUnitHeaderCleanup = initializeDynamicUnitHeader(mountNode);
    bindSectionChestClicks(mountNode);
  }

  document.dispatchEvent(new CustomEvent(`view:${viewName}:mounted`));
}

function formatDuration(seconds) {
  const clamped = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatJoinedDate(dateValue) {
  if (!dateValue) return 'Se unió recientemente';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Se unió recientemente';
  return `Se unió el ${new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}`;
}

function formatTimeInvested(seconds) {
  const clamped = Math.max(0, Number(seconds) || 0);
  const totalHours = Math.floor(clamped / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h`;
}

function updateStoreStatus(state) {
  const livesLabel = document.getElementById('store-lives-label');
  const infiniteLabel = document.getElementById('store-infinite-status');
  if (livesLabel) {
    livesLabel.textContent = `${state.lives} / ${state.maxLives}`;
  }
  if (infiniteLabel) {
    infiniteLabel.textContent = state.infiniteHeartsActive
      ? `💖 Corazones ilimitados activos (${formatDuration(state.infiniteHeartsRemainingSeconds)} restantes)`
      : '';
  }
}

function updateStorePurchaseAvailability(state) {
  const livesAtMax = Number(state.lives) >= Number(state.maxLives);
  const infiniteActive = Boolean(state.infiniteHeartsActive);
  const buyButtons = [...document.querySelectorAll('.product-card__buy[data-product-id]')];

  buyButtons.forEach((btn) => {
    const productId = btn.dataset.productId;
    const isLivesProduct = productId === 'single_heart' || productId === 'heart_bundle';
    const isInfiniteProduct = productId === 'infinite_hearts_24h';
    const blocked = (isLivesProduct && livesAtMax) || (isInfiniteProduct && infiniteActive);

    btn.disabled = false;
    btn.setAttribute('aria-disabled', String(blocked));
    if (isLivesProduct && livesAtMax) {
      btn.title = 'Ya tienes el máximo de corazones';
    } else if (isInfiniteProduct && infiniteActive) {
      btn.title = 'Ya tienes corazones ilimitados activos';
    } else {
      btn.title = '';
    }
  });
}

function bindStoreActions() {
  const buyButtons = [...document.querySelectorAll('.product-card__buy[data-product-id]')];
  if (buyButtons.length === 0) return;

  const initialState = window.currentUserState || { lives: 0, maxLives: 5, infiniteHeartsActive: false };
  updateStoreStatus(initialState);
  updateStorePurchaseAvailability(initialState);

  buyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      if (!productId) return;

      const state = window.currentUserState || { lives: 0, maxLives: 5, infiniteHeartsActive: false };
      const livesAtMax = Number(state.lives) >= Number(state.maxLives);
      if ((productId === 'single_heart' || productId === 'heart_bundle') && livesAtMax) {
        window.showLsmModal?.({ message: '¡Corazones al máximo! Ya tienes todas tus vidas disponibles.' });
        updateStorePurchaseAvailability(state);
        return;
      }
      if (productId === 'infinite_hearts_24h' && state.infiniteHeartsActive) {
        window.showLsmModal?.({ message: '¡Poder activo! Ya tienes corazones ilimitados en este momento.' });
        updateStorePurchaseAvailability(state);
        return;
      }

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>Comprando...</span>';

      try {
        const updated = await purchaseStoreItemGlobal(productId);
        window.currentUserState = updated;
        updateStoreStatus(updated);
        updateStorePurchaseAvailability(updated);
        await refreshStatusBar();

        const purchaseAnimationByProduct = {
          single_heart: showSingleHeartAnimation,
          heart_bundle: showHeartBundleAnimation,
          infinite_hearts_24h: showInfiniteHeartsAnimation,
        };
        const showPurchaseAnimation = purchaseAnimationByProduct[productId];

        window.showLsmModal?.({
          title: '¡Listo!',
          message: 'Compra realizada correctamente. Tu recompensa ya está disponible.',
          onConfirm: showPurchaseAnimation,
        });
      } catch (err) {
        window.showLsmModal?.({ title: '¡Ups!', message: err.message || 'No pudimos completar la acción. Inténtalo de nuevo.' });
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        updateStorePurchaseAvailability(window.currentUserState || state);
      }
    });
  });
}

function updateProfileView(state) {
  const avatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const joined = document.getElementById('profile-joined');
  const progressPercent = document.getElementById('profile-progress-percent');
  const progressFill = document.getElementById('profile-progress-fill');
  const progressMeta = document.getElementById('profile-progress-meta');
  const streak = document.getElementById('profile-streak');
  const gems = document.getElementById('profile-gems');
  const lessons = document.getElementById('profile-lessons');
  const timeHours = document.getElementById('profile-time-hours');

  const xp = Math.max(0, Number(state.experience) || 0);
  const routeLevel = Math.max(1, Number(state.level) || 1);
  const xpProgress = getExperienceProgress(xp);
  const time = formatTimeInvested(state.timeInvestedSeconds);
  const avatarSrc = state.profilePhotoBase64 || state.profilePhotoUrl || DEFAULT_PROFILE_AVATAR_SRC;

  if (avatar) avatar.src = avatarSrc;
  if (profileName) profileName.textContent = state.usuario || 'Usuario';
  if (joined) joined.innerHTML = `<span class="material-symbols-outlined">calendar_today</span>${formatJoinedDate(state.createdAt)}`;
  if (progressPercent) progressPercent.textContent = `${xpProgress.percent}%`;
  if (progressFill) progressFill.style.width = `${xpProgress.percent}%`;
  if (progressMeta) {
    progressMeta.innerHTML = `
      <span>Nivel de cuenta ${xpProgress.accountLevel} • Ruta ${routeLevel} • ${xp.toLocaleString('es-MX')} XP</span>
      <span>${xpProgress.currentXpInLevel.toLocaleString('es-MX')} / ${xpProgress.neededXpForNext.toLocaleString('es-MX')} XP para el siguiente nivel</span>
    `;
  }
  if (streak) streak.textContent = `${Number(state.streakDays) || 0} días`;
  if (gems) gems.textContent = `${Number(state.gems) || 0}`;
  if (lessons) lessons.textContent = `${Number(state.lessonsDone) || 0}`;
  if (timeHours) timeHours.textContent = time;
}

function bindProfileActions() {
  updateProfileView(window.currentUserState || {});
  const editBtn = document.getElementById('profile-edit-btn');
  const input = document.getElementById('profile-photo-input');
  if (!editBtn || !input) return;

  editBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.showLsmModal?.({ message: 'Solo se permiten imágenes para la foto de perfil.' });
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      window.showLsmModal?.({ message: 'La foto de perfil debe ser de máximo 10 MB.' });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const updated = await updateProfilePhotoGlobal(reader.result);
        window.currentUserState = updated;
        updateProfileView(updated);
      } catch (err) {
        window.showLsmModal?.({ title: '¡Ups!', message: err.message || 'No pudimos completar la acción. Inténtalo de nuevo.' });
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      window.showLsmModal?.({ title: '¡Ups!', message: 'No se pudo leer la imagen seleccionada.' });
      input.value = '';
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const session = loadSession();
  const contentRoot = document.getElementById('main-content');

  if (!session?.usuario) {
    window.location.replace(LOGIN_URL);
    return;
  }

  const sidebarRoot = document.getElementById('sidebar-nav');
  const sidebar = sidebarRoot
    ? new window.SidebarNav(sidebarRoot, {
      onViewChange: (viewName) => mountView(viewName, contentRoot),
    })
    : null;

  document.addEventListener('view:tienda:mounted', bindStoreActions);
  document.addEventListener('view:perfil:mounted', bindProfileActions);

  const initialView = sidebar?.activeView || 'aprender';
  mountView(initialView, contentRoot);

  const logoutBtn = document.getElementById('btn-logout');
  logoutBtn?.addEventListener('click', () => {
    clearSession();
    window.location.replace(LOGIN_URL);
  });

  await refreshStatusBar();
  bindSectionChestClicks(document);
  document.dispatchEvent(new CustomEvent('user-state-ready', { detail: window.currentUserState }));
});
