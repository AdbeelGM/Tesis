/**
 * @file modal.js
 * @description Define el modal global de LSM Gamificada para mostrar avisos, confirmaciones y errores accesibles con acciones primaria y secundaria opcional.
 * @module Interfaz
 */
(function () {
  const DEFAULTS = {
    title: '¡Atención!',
    message: 'Revisa la acción e intenta de nuevo.',
    buttonText: '¡ENTENDIDO!',
    secondaryButtonText: '',
  };

  /**
   * Cierra un modal con animación y ejecuta la acción final asociada.
   * @param {HTMLElement} overlay - Capa del modal que será retirada del DOM.
   * @param {Function} onClose - Callback opcional que se ejecuta después del cierre.
   * @returns {void} No devuelve valor; programa la eliminación del modal.
   */
function closeModal(overlay, onClose) {
    if (overlay.dataset.closing === 'true') return;
    overlay.dataset.closing = 'true';
    overlay.classList.add('lsm-modal-overlay--closing');
    window.setTimeout(() => {
      overlay.remove();
      onClose?.();
    }, 160);
  }

  /**
   * Muestra un modal accesible para avisos o confirmaciones de LSM Gamificada.
   * @param {Object} options - Textos y callbacks que personalizan el modal.
   * @returns {HTMLElement} Overlay creado para que el llamador pueda verificar que el modal existe.
   */
function showLsmModal(options = {}) {
    const settings = { ...DEFAULTS, ...options };
    document.querySelectorAll('.lsm-modal-overlay').forEach((modal) => modal.remove());

    const overlay = document.createElement('div');
    overlay.className = 'lsm-modal-overlay';
    overlay.setAttribute('role', 'presentation');

    const modal = document.createElement('div');
    modal.className = 'lsm-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lsm-modal-title');
    modal.setAttribute('aria-describedby', 'lsm-modal-message');

    const closeButton = document.createElement('button');
    closeButton.className = 'lsm-modal__close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Cerrar mensaje');
    closeButton.innerHTML = '<span class="material-symbols-outlined">close</span>';

    const content = document.createElement('div');
    content.className = 'lsm-modal__content';

    const title = document.createElement('h2');
    title.className = 'lsm-modal__title';
    title.id = 'lsm-modal-title';
    title.textContent = settings.title;

    const message = document.createElement('p');
    message.className = 'lsm-modal__message';
    message.id = 'lsm-modal-message';
    message.textContent = settings.message;

    const actions = document.createElement('div');
    actions.className = 'lsm-modal__actions';

    const actionButton = document.createElement('button');
    actionButton.className = 'lsm-modal__action';
    actionButton.type = 'button';
    actionButton.textContent = settings.buttonText;

    let secondaryButton = null;
    if (settings.secondaryButtonText) {
      secondaryButton = document.createElement('button');
      secondaryButton.className = 'lsm-modal__action lsm-modal__action--secondary';
      secondaryButton.type = 'button';
      secondaryButton.textContent = settings.secondaryButtonText;
      actions.appendChild(secondaryButton);
    }

    actions.appendChild(actionButton);
    content.append(title, message, actions);
    modal.append(closeButton, content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const handleClose = () => closeModal(overlay, settings.onClose);
    const handleAction = () => closeModal(overlay, settings.onConfirm || settings.onClose);
    closeButton.addEventListener('click', handleClose);
    secondaryButton?.addEventListener('click', handleClose);
    actionButton.addEventListener('click', handleAction);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) handleClose();
    });

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && document.body.contains(overlay)) {
        handleClose();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    actionButton.focus();

    return overlay;
  }

  window.showLsmModal = showLsmModal;
})();
