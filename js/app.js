import { loadSession, clearSession } from './user-session.js';
import { refreshStatusBar } from './statusbar.js';
import { purchaseStoreItemGlobal, updateProfilePhotoGlobal } from './game-state.js';

const LOGIN_URL = 'login.html';
const XP_BASE_REQUIREMENT = 120;

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
    title: 'Abecedario',
    subtitle: 'Reconoce letras, compara señas y escribe respuestas cortas.',
    levels: [1, 2, 3, 4, 5],
    offsets: [90, -80, 0, 100, -60],
  },
  {
    eyebrow: 'Sección 2',
    title: 'Colores',
    subtitle: 'Avanza desde identificación básica hasta escritura de colores.',
    levels: [6, 7, 8, 9, 10],
    offsets: [-70, 85, -15, 95, -55],
  },
  {
    eyebrow: 'Sección 3',
    title: 'Continentes y países',
    subtitle: 'Practica lugares con retos más largos y respuestas abiertas.',
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

function renderSectionTransition(unit, index) {
  return `
    <div class="route__section-transition" aria-hidden="true">
      <div class="route__section-divider">
        <span class="route__section-line"></span>
        <span class="route__section-text">${unit.title}</span>
        <span class="route__section-line"></span>
      </div>
      <div class="route__section-marker">
        <span class="material-symbols-outlined">lock_open</span>
      </div>
      <p class="route__section-label">Siguiente: ${LEARN_UNITS[index + 1].eyebrow}</p>
    </div>
  `;
}

function renderLearnView() {
  const sectionsMarkup = LEARN_UNITS
    .map((unit, index) => {
      const pathMarkup = renderLevelPath(unit, index);
      const hasNextUnit = index < LEARN_UNITS.length - 1;
      if (!hasNextUnit) return pathMarkup;
      return `${pathMarkup}${renderSectionTransition(unit, index)}`;
    })
    .join('');

  return `
    <div class="route__learn">
      ${renderLearnUnitHeader()}
      <div class="route__sections">
        ${sectionsMarkup}
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
              <h1 class="store__title">LSM Quest Store</h1>
              <p class="store__subtitle">Refill your lives and keep learning!</p>
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
            <h3 class="product-card__title">Single Heart</h3>
            <p class="product-card__description">One life to keep your streak alive</p>
            <button class="product-card__buy btn-hover-elevate btn-active-press" data-product-id="single_heart" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>100 Gems</span>
            </button>
          </article>

          <article class="product-card product-card--featured btn-active-press">
            <span class="product-card__badge">Most Popular</span>
            <div class="product-card__icon-wrap product-card__icon-wrap--cluster">
              <span class="material-symbols-outlined product-card__icon product-card__icon--small top-left" style="font-variation-settings: 'FILL' 1;">favorite</span>
              <span class="material-symbols-outlined product-card__icon" style="font-variation-settings: 'FILL' 1;">favorite</span>
              <span class="material-symbols-outlined product-card__icon product-card__icon--small bottom-right" style="font-variation-settings: 'FILL' 1;">favorite</span>
            </div>
            <h3 class="product-card__title">Heart Bundle</h3>
            <p class="product-card__description">Full refill! Get 5 hearts instantly</p>
            <button class="product-card__buy btn-3d-orange btn-hover-elevate btn-active-press" data-product-id="heart_bundle" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>450 Gems</span>
            </button>
          </article>

          <article class="product-card btn-active-press">
            <span class="product-card__badge product-card__badge--teal">Special Offer</span>
            <div class="product-card__icon-wrap product-card__icon-wrap--teal">
              <span class="material-symbols-outlined product-card__icon product-card__icon--teal">all_inclusive</span>
              <span class="product-card__mini-heart material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">favorite</span>
            </div>
            <h3 class="product-card__title">Infinite Hearts</h3>
            <p class="product-card__description">24 hours of unlimited learning</p>
            <button class="product-card__buy btn-hover-elevate btn-active-press" data-product-id="infinite_hearts_24h" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>950 Gems</span>
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
                  <img id="profile-avatar" class="profile-avatar" src="https://images.unsplash.com/photo-1737048236257-c4f4d90f90d3?auto=format&fit=crop&w=400&q=80" alt="Foto de perfil">
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
                    Journey Progress
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

    btn.disabled = blocked;
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
        alert('⚠️ Ya tienes el máximo de corazones.');
        updateStorePurchaseAvailability(state);
        return;
      }
      if (productId === 'infinite_hearts_24h' && state.infiniteHeartsActive) {
        alert('⚠️ Ya tienes corazones ilimitados activos.');
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
        alert('✅ Compra realizada');
      } catch (err) {
        alert(`❌ ${err.message}`);
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
  const avatarSrc = state.profilePhotoBase64 || state.profilePhotoUrl || 'https://images.unsplash.com/photo-1737048236257-c4f4d90f90d3?auto=format&fit=crop&w=400&q=80';

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
      alert('⚠️ Solo se permiten imágenes para la foto de perfil.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ La foto de perfil debe ser de máximo 10 MB.');
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
        alert(`❌ ${err.message}`);
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      alert('❌ No se pudo leer la imagen seleccionada.');
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
  document.dispatchEvent(new CustomEvent('user-state-ready', { detail: window.currentUserState }));
});
