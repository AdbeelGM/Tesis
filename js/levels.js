function applyLevelNodeState(node, currentLevel) {
  const level = Number(node.dataset.level);
  if (!level) return;

  const item = node.closest('.level-item');
  const isCompleted = level < currentLevel;
  const isCurrent = level === currentLevel;
  const isLocked = level > currentLevel;

  node.classList.toggle('level-node--completed', isCompleted);
  node.classList.toggle('level-node--current', isCurrent);
  node.classList.toggle('level-node--locked', isLocked);

  item?.classList.toggle('level-item--completed', isCompleted);
  item?.classList.toggle('level-item--current', isCurrent);
  item?.classList.toggle('level-item--locked', isLocked);

  if (item && !item.querySelector('.start-badge')) {
    const badge = document.createElement('div');
    badge.className = 'start-badge';
    badge.textContent = 'Inicio';
    item.insertBefore(badge, node);
  }

  if (isCompleted) {
    node.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">check</span>';
    node.setAttribute('aria-label', `Nivel ${level} completado`);
    return;
  }

  if (isLocked) {
    node.innerHTML = '<span class="material-symbols-outlined">lock</span>';
    node.setAttribute('aria-label', `Nivel ${level} bloqueado`);
    return;
  }

  node.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">sign_language</span>';
  node.setAttribute('aria-label', `Nivel ${level} actual`);
}

function renderLevelStates(root = document) {
  const userState = window.currentUserState;
  if (!userState) return;

  const nodes = root.querySelectorAll('.level-node[data-level]');
  const currentLevel = Number(userState.level) || 1;
  nodes.forEach((node) => applyLevelNodeState(node, currentLevel));
}

function bindLevelClicks(root = document) {
  const nodes = root.querySelectorAll('.level-node[data-level]');

  nodes.forEach((node) => {
    if (node.dataset.boundClick === 'true') return;

    node.addEventListener('click', () => {
      const level = Number(node.dataset.level);
      const userState = window.currentUserState;

      if (!level) {
        window.showLsmModal?.({ message: 'No pudimos identificar este nivel. Intenta actualizar la página.' });
        return;
      }

      if (!userState) {
        window.showLsmModal?.({ message: 'Inicia sesión para acceder a tus niveles y continuar tu ruta.' });
        return;
      }

      if (level > Number(userState.level)) {
        window.showLsmModal?.({ message: '¡Nivel Bloqueado! Completa las lecciones anteriores para desbloquear este camino.' });
        return;
      }

      const target = `plantilla.html?level=${encodeURIComponent(level)}`;

      if (level < Number(userState.level)) {
        const modal = window.showLsmModal?.({
          title: '¡Atención!',
          message: `Ya completaste el nivel ${level}. ¿Seguro que quieres repetirlo?`,
          buttonText: 'Sí',
          secondaryButtonText: 'No',
          onConfirm: () => {
            window.location.href = target;
          },
        });

        if (!modal) {
          const shouldRepeat = window.confirm(`Ya completaste el nivel ${level}. ¿Seguro que quieres repetirlo?`);
          if (shouldRepeat) window.location.href = target;
        }

        return;
      }

      window.location.href = target;
    });

    node.dataset.boundClick = 'true';
  });
}

function initializeLearnView() {
  bindLevelClicks(document);
  renderLevelStates(document);
}

document.addEventListener('DOMContentLoaded', initializeLearnView);
document.addEventListener('user-state-ready', () => renderLevelStates(document));
document.addEventListener('view:aprender:mounted', initializeLearnView);
