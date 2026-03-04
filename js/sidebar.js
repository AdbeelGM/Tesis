// js/sidebar.js
class SidebarNav {
  constructor(rootElement) {
    this.root = rootElement;
    this.buttons = Array.from(this.root.querySelectorAll(".nav-btn"));
    this._bindEvents();
  }

  _bindEvents() {
    this.buttons.forEach((btn) => {
      btn.addEventListener("click", () => this._setActive(btn));
    });
  }

  _setActive(activeButton) {
    this.buttons.forEach((btn) =>
      btn.classList.toggle("nav-btn--active", btn === activeButton)
    );

    // Aquí en el futuro podrías cambiar la vista según data-view
    // const view = activeButton.dataset.view;
    // ...
  }
}

// Export simple
window.SidebarNav = SidebarNav;
