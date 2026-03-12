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
    badge.textContent = 'Start';
    item.insertBefore(badge, node);
  }

  if (isCompleted) {
    node.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">check</span>';
    node.setAttribute('aria-label', `Nivel ${level} completado`);
    return;
  }

  if (isLocked) {
    if (level === 4) {
      node.innerHTML = '<span class="material-symbols-outlined">redeem</span>';
    } else {
      node.innerHTML = '<span class="material-symbols-outlined">lock</span>';
    }
    node.setAttribute('aria-label', `Nivel ${level} bloqueado`);
    return;
  }

  node.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">sign_language</span>';
  node.setAttribute('aria-label', `Nivel ${level} actual`);
}

function renderLevelStates(nodes) {
  const userState = window.currentUserState;
  if (!userState) return;

  const currentLevel = Number(userState.level) || 1;
  nodes.forEach((node) => applyLevelNodeState(node, currentLevel));
}

document.addEventListener('DOMContentLoaded', () => {
  const nodes = document.querySelectorAll('.level-node');

  nodes.forEach((node) => {
    node.addEventListener('click', () => {
      const level = Number(node.dataset.level);
      const userState = window.currentUserState;

      if (!level) {
        console.warn('Este botón no tiene data-level:', node);
        return;
      }

      if (!userState) {
        alert('Inicia sesión para acceder a los niveles.');
        return;
      }

      if (level > Number(userState.level)) {
        alert('Este ejercicio está bloqueado por ahora.');
        return;
      }

      const target = `plantilla.html?level=${encodeURIComponent(level)}`;
      window.location.href = target;
    });
  });

  renderLevelStates(nodes);
  document.addEventListener('user-state-ready', () => renderLevelStates(nodes));
});
