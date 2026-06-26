/*
 * Nombre: route.js
 * Descripción: Renderiza y enlaza la ruta de aprendizaje.
 * Módulo: Frontend / Ruta
 */
import { showRouteChestAnimation } from '../rewards/rewards.js';

function bindSectionChestClicks(root = document) {
  const chests = [...root.querySelectorAll('[data-section-chest]')];
  const currentLevel = Number(window.currentUserState?.level) || 1;

  chests.forEach((chest) => {
    const lastLevel = Number(chest.dataset.sectionLastLevel) || 0;
    const unlocked = currentLevel > lastLevel;

    chest.disabled = false;
    chest.setAttribute('aria-disabled', String(!unlocked));
    chest.classList.toggle('route__section-chest--locked', !unlocked);
    chest.classList.toggle('route__section-chest--ready', unlocked);
    chest.setAttribute('aria-label', unlocked ? 'Abrir cofre de sección' : 'Cofre de sección bloqueado');

    if (chest.dataset.boundChest === 'true') return;
    chest.addEventListener('click', () => {
      if (chest.getAttribute('aria-disabled') === 'true') {
        window.showLsmModal?.({ message: '¡Cofre Bloqueado! Completa todos los niveles de esta sección para abrirlo.' });
        return;
      }

      showRouteChestAnimation();
    });
    chest.dataset.boundChest = 'true';
  });
}

const LEARN_UNITS = [
  {
    eyebrow: 'Sección 1',
    title: 'Primeros pasos',
    subtitle: 'Aprende el abecedario, los números y los colores en LSM.',
    levels: [1, 2, 3, 4, 5],
    offsets: [90, -80, 0, 100, -60],
  },
  {
    eyebrow: 'Sección 2',
    title: 'Hablando con otros',
    subtitle: 'Practica saludos, familia, pronombres y expresiones del día a día.',
    levels: [6, 7, 8, 9, 10],
    offsets: [-70, 85, -15, 95, -55],
  },
  {
    eyebrow: 'Sección 3',
    title: 'El mundo y la vida cotidiana',
    subtitle: 'Explora lugares, transportes, tecnología y más en LSM.',
    levels: [11, 12, 13, 14, 15],
    offsets: [80, -90, 10, 100, -65],
  },
];

function renderLevelPath(unit, unitIndex) {
  return `
    <section class="route__path" data-unit-index="${unitIndex}">
      <svg class="route__snake" viewBox="0 0 100 600" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50,0 C80,100 20,200 50,300 C80,400 20,500 50,600"></path>
      </svg>

      ${unit.levels.map((level, index) => `
        <div class="level-item" style="--offset-x: ${unit.offsets[index] || 0}px">
          <button class="level-node" data-level="${level}" type="button"></button>
        </div>
      `).join('')}

      <div class="level-item level-item--section-chest" style="--offset-x: 0px">
        <button
          class="level-node route__section-chest"
          data-section-chest="${unitIndex}"
          data-section-last-level="${unit.levels[unit.levels.length - 1]}"
          type="button"
        >
          <span class="material-symbols-outlined">featured_seasonal_and_gifts</span>
        </button>
      </div>
    </section>
  `;
}

function renderLearnUnitHeader(unit = LEARN_UNITS[0]) {
  return `
    <section class="route__unit-card route__unit-card--sticky" data-dynamic-unit-card aria-live="polite">
      <div class="route__unit-copy">
        <span class="route__eyebrow" data-dynamic-unit-eyebrow>${unit.eyebrow}</span>
        <h1 class="route__title" data-dynamic-unit-title>${unit.title}</h1>
        <p class="route__subtitle" data-dynamic-unit-subtitle>${unit.subtitle}</p>
      </div>
      <button class="route__guide btn-hover-elevate btn-active-press" type="button">Guide</button>
      <div class="route__orb route__orb--big"></div>
      <div class="route__orb route__orb--small"></div>
    </section>
  `;
}

function renderLearnView() {
  return `
    <div class="route__learn">
      ${renderLearnUnitHeader()}
      <div class="route__sections">
        ${LEARN_UNITS.map((unit, index) => `
          ${renderLevelPath(unit, index)}
          ${index < LEARN_UNITS.length - 1 ? `<p class="route__transition-text">${LEARN_UNITS[index + 1].eyebrow} · ${LEARN_UNITS[index + 1].title}</p>` : ''}
        `).join('')}
      </div>
    </div>
  `;
}


function setDynamicUnitHeader(root, unitIndex) {
  const unit = LEARN_UNITS[unitIndex] || LEARN_UNITS[0];
  const card = root.querySelector('[data-dynamic-unit-card]');
  const eyebrow = root.querySelector('[data-dynamic-unit-eyebrow]');
  const title = root.querySelector('[data-dynamic-unit-title]');
  const subtitle = root.querySelector('[data-dynamic-unit-subtitle]');

  if (!card || !unit || card.dataset.activeUnitIndex === String(unitIndex)) return;

  card.dataset.activeUnitIndex = String(unitIndex);
  card.classList.add('route__unit-card--changing');

  if (eyebrow) eyebrow.textContent = unit.eyebrow;
  if (title) title.textContent = unit.title;
  if (subtitle) subtitle.textContent = unit.subtitle;

  window.setTimeout(() => card.classList.remove('route__unit-card--changing'), 180);
}

function initializeDynamicUnitHeader(root) {
  const sections = [...root.querySelectorAll('.route__path[data-unit-index]')];
  const card = root.querySelector('[data-dynamic-unit-card]');
  if (sections.length === 0 || !card) return null;

  let frame = null;
  const getSwitchLine = () => {
    const rootRect = root.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const stickyOffset = Math.max(16, cardRect.top - rootRect.top);
    return rootRect.top + stickyOffset + cardRect.height + 24;
  };

  const updateActiveUnit = () => {
    frame = null;
    const switchLine = getSwitchLine();
    const activeSection = sections.reduce((active, section) => {
      const sectionTop = section.getBoundingClientRect().top;
      return sectionTop <= switchLine ? section : active;
    }, sections[0]);

    setDynamicUnitHeader(root, Number(activeSection.dataset.unitIndex) || 0);
  };

  const requestUpdate = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(updateActiveUnit);
  };

  root.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateActiveUnit();

  return () => {
    root.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}

export { renderLearnView, initializeDynamicUnitHeader, bindSectionChestClicks };
