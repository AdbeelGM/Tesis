import { loadSession, clearSession } from './user-session.js';
import { refreshStatusBar } from './statusbar.js';

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
              <span>5 / 5</span>
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
            <button class="product-card__buy btn-hover-elevate btn-active-press" type="button">
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
            <button class="product-card__buy btn-3d-orange btn-hover-elevate btn-active-press" type="button">
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
            <button class="product-card__buy btn-hover-elevate btn-active-press" type="button">
              <span class="material-symbols-outlined">diamond</span>
              <span>950 Gems</span>
            </button>
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderProfileView() {
  return `
    <section class="profile-view">
      <div class="profile-view__card">
        <span class="material-symbols-outlined profile-view__icon">person</span>
        <h1>Profile</h1>
        <p>Tu perfil estará aquí en la siguiente sección.</p>
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
