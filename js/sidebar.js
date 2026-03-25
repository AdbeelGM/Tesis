class SidebarNav {
  constructor(rootElement, options = {}) {
    this.root = rootElement;
    this.buttons = Array.from(this.root.querySelectorAll('.nav-btn'));
    this.onViewChange = options.onViewChange || null;
    this.activeView = this.buttons.find((btn) => btn.classList.contains('nav-btn--active'))?.dataset.view || null;
    this._bindEvents();
  }

  _bindEvents() {
    this.buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextView = btn.dataset.view;
        this.setActive(nextView);
        this.onViewChange?.(nextView);
      });
    });
  }

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
