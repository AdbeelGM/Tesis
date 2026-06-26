/**
 * @file sidebar.js
 * @description Implementa la navegación lateral entre las secciones principales y mantiene sincronizado el botón activo con la vista montada.
 * @module Navegación
 */
/**
 * Representa la navegación lateral de LSM Gamificada y coordina el cambio entre aprendizaje, tienda y perfil.
 */
class SidebarNav {
  /**
   * Crea la navegación a partir de sus botones y registra la vista activa inicial.
   * @param {HTMLElement} rootElement - Contenedor que agrupa los botones de navegación.
   * @param {Object} options - Opciones de configuración para la navegación.
   * @param {Function} options.onViewChange - Callback ejecutado al seleccionar otra vista.
   */
  constructor(rootElement, options = {}) {
    this.root = rootElement;
    this.buttons = Array.from(this.root.querySelectorAll('.nav-btn'));
    this.onViewChange = options.onViewChange || null;
    this.activeView = this.buttons.find((btn) => btn.classList.contains('nav-btn--active'))?.dataset.view || null;
    this._bindEvents();
  }

  /**
   * Enlaza los clics de cada botón con el cambio de vista correspondiente.
   * @returns {void} No devuelve valor; registra listeners sobre los botones.
   */
  _bindEvents() {
    this.buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextView = btn.dataset.view;
        this.setActive(nextView);
        this.onViewChange?.(nextView);
      });
    });
  }

  /**
   * Marca visualmente una vista como activa y ajusta el relleno de sus iconos.
   * @param {string} viewName - Identificador de la vista que debe quedar seleccionada.
   * @returns {void} No devuelve valor; actualiza clases y estilos inline de iconos.
   */
  setActive(viewName) {
    this.activeView = viewName;
    this.buttons.forEach((btn) => {
      const isActive = btn.dataset.view === viewName;
      btn.classList.toggle('nav-btn--active', isActive);
      const icon = btn.querySelector('.nav-btn__icon');
      if (icon) {
        icon.style.fontVariationSettings = isActive
          ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24";
      }
    });
  }
}

window.SidebarNav = SidebarNav;
