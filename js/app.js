/*
 * Nombre: app.js
 * Descripción: Orquesta la ruta de aprendizaje, tienda, perfil y sesión del usuario.
 * Módulo: Frontend / Aplicación principal
 */
import { loadSession, clearSession } from './user-session.js';
import { refreshStatusBar } from './statusbar.js';
import { renderLearnView, initializeDynamicUnitHeader, bindSectionChestClicks } from './route/route.js';
import { renderStoreView, bindStoreActions } from './store/store.js';
import { renderProfileView, bindProfileActions } from './profile/profile.js';

const LOGIN_URL = 'login.html';

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
