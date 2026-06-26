/**
 * @file store.js
 * @description Renderiza la tienda de vidas y poderes, valida disponibilidad de compras, ejecuta transacciones contra el estado del juego y dispara animaciones de recompensa.
 * @module Tienda
 */
import { refreshStatusBar } from '../statusbar.js';
import { purchaseStoreItemGlobal } from '../game-state.js';
import { showSingleHeartAnimation, showHeartBundleAnimation, showInfiniteHeartsAnimation } from '../rewards/rewards.js';

/**
 * Genera el HTML de la tienda con productos de vidas y corazones infinitos.
 * @returns {string} Marcado HTML de la tienda listo para montarse.
 */
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

/**
 * Convierte segundos restantes de un poder en horas y minutos.
 * @param {number} seconds - Segundos restantes de corazones infinitos.
 * @returns {string} Duración legible para el estado de la tienda.
 */
function formatDuration(seconds) {
  const clamped = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  return `${h}h ${m}m`;
}

/**
 * Actualiza los contadores visibles de vidas y poder activo dentro de la tienda.
 * @param {Object} state - Estado actual del jugador con vidas y corazones infinitos.
 * @returns {void} No devuelve valor; modifica textos del DOM.
 */
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

/**
 * Marca compras como no disponibles cuando el usuario ya tiene vidas máximas o poder activo.
 * @param {Object} state - Estado del jugador usado para decidir bloqueos de productos.
 * @returns {void} No devuelve valor; actualiza atributos accesibles y títulos.
 */
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

/**
 * Enlaza los botones de compra, ejecuta transacciones y muestra recompensas o errores.
 * @returns {void} No devuelve valor; registra listeners sobre productos disponibles.
 */
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

export { renderStoreView, bindStoreActions };
