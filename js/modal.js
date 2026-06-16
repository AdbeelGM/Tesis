(function () {
  const DEFAULTS = {
    title: '¡Atención!',
    message: 'Revisa la acción e intenta de nuevo.',
    buttonText: '¡ENTENDIDO!',
  };

  function closeModal(overlay) {
    overlay.classList.add('lsm-modal-overlay--closing');
    window.setTimeout(() => overlay.remove(), 160);
  }

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

    const actionButton = document.createElement('button');
    actionButton.className = 'lsm-modal__action';
    actionButton.type = 'button';
    actionButton.textContent = settings.buttonText;

    content.append(title, message, actionButton);
    modal.append(closeButton, content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const handleClose = () => closeModal(overlay);
    closeButton.addEventListener('click', handleClose);
    actionButton.addEventListener('click', handleClose);
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
