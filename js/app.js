import { loadSession, clearSession } from './user-session.js';
import { refreshStatusBar } from './statusbar.js';
import { purchaseStoreItemGlobal } from './game-state.js';

const LOGIN_URL = 'login.html';

function renderLearnView() {
  return `
    <section class="route__unit-card">
      <div>
        <h1 class="route__title">Unit 1: Basics</h1>
        <p class="route__subtitle">Greetings, Alphabet, and Numbers</p>
      </div>
      <button class="route__guide btn-hover-elevate btn-active-press" type="button">Guide</button>
      <div class="route__orb route__orb--big"></div>
      <div class="route__orb route__orb--small"></div>
    </section>

    <section class="route__path">
      <svg class="route__snake" viewBox="0 0 100 600" preserveAspectRatio="none">
        <path d="M50,0 C80,100 20,200 50,300 C80,400 20,500 50,600"></path>
      </svg>

      <div class="level-item" style="--offset-x: 90px">
        <button class="level-node" data-level="1" type="button"></button>
      </div>
      <div class="level-item" style="--offset-x: -80px">
        <button class="level-node" data-level="2" type="button"></button>
      </div>
      <div class="level-item" style="--offset-x: 0px">
        <div class="start-badge">Start</div>
        <button class="level-node" data-level="3" type="button"></button>
      </div>
      <div class="level-item" style="--offset-x: 100px">
        <button class="level-node" data-level="4" type="button"></button>
      </div>
      <div class="level-item" style="--offset-x: -60px">
        <button class="level-node" data-level="5" type="button"></button>
      </div>
      <div class="level-item" style="--offset-x: 0px">
        <button class="level-node" data-level="6" type="button"></button>
      </div>
    </section>
  `;
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
                <img class="profile-avatar" src="https://images.unsplash.com/photo-1737048236257-c4f4d90f90d3?auto=format&fit=crop&w=400&q=80" alt="Alex Pathweaver">
              </div>
              <span class="profile-pro-badge">PRO</span>
            </div>

            <div class="profile-main-info">
              <div class="profile-header-row">
                <div>
                  <div class="profile-name-row">
                    <h1 class="profile-name">Alex Pathweaver</h1>
                    <span class="material-symbols-outlined profile-verified" style="font-variation-settings: 'FILL' 1;">verified</span>
                  </div>
                  <p class="profile-meta">
                    <span class="material-symbols-outlined">calendar_today</span>
                    Se unió en enero de 2026
                  </p>
                </div>

                <button class="profile-edit-btn btn-active-press" type="button">
                  <span class="material-symbols-outlined">edit</span>
                  Edit Profile
                </button>
              </div>

              <div class="profile-progress-wrap">
                <div class="profile-progress-head">
                  <span class="profile-progress-title">
                    <span class="material-symbols-outlined">auto_awesome</span>
                    Journey Progress
                  </span>
                  <span class="profile-progress-percent">74%</span>
                </div>

                <div class="profile-progress-track">
                  <div class="profile-progress-fill progress-fill" style="width: 74%;">
                    <span class="profile-progress-dot"></span>
                  </div>
                </div>

                <div class="profile-progress-meta">
                  <span>Level 12 (12,400 XP)</span>
                  <span>Next: Level 13 (15,000 XP)</span>
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
              <h3>7 days</h3>
              <p>Daily Streak</p>
            </article>

            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--yellow">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">diamond</span>
              </div>
              <h3>1,240</h3>
              <p>Total Gems</p>
            </article>

            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--teal">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">task_alt</span>
              </div>
              <h3>48</h3>
              <p>Lessons Done</p>
            </article>
          </div>

          <article class="profile-quests-card card-hover-lift">
            <h4>Total Quests</h4>
            <strong>148</strong>
            <div class="profile-quests-separator"></div>
            <p>Time Invested</p>
            <span>242 Hours</span>
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

  const renderer = views[viewName] || views.aprender;
  mountNode.innerHTML = renderer();
  document.dispatchEvent(new CustomEvent(`view:${viewName}:mounted`));
}

function formatDuration(seconds) {
  const clamped = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  return `${h}h ${m}m`;
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
