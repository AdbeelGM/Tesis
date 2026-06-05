const FINE_POINTER_QUERY = '(pointer: fine)';
const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
  'summary',
].join(',');

const finePointerMedia = window.matchMedia(FINE_POINTER_QUERY);
let cursor;
let clickResetTimeout;

function ensureCursor() {
  if (cursor) return cursor;

  cursor = document.createElement('div');
  cursor.className = 'pixel-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  const sprite = document.createElement('div');
  sprite.className = 'pixel-cursor__sprite';
  cursor.appendChild(sprite);

  document.body.appendChild(cursor);
  return cursor;
}

function setCursorPosition(event) {
  const cursorElement = ensureCursor();
  cursorElement.style.setProperty('--cursor-x', `${event.clientX}px`);
  cursorElement.style.setProperty('--cursor-y', `${event.clientY}px`);
  cursorElement.classList.add('pixel-cursor--visible');
}

function updateCursorMode(event) {
  if (!cursor) return;

  const target = event.target instanceof Element ? event.target : null;
  const interactiveTarget = target?.closest(INTERACTIVE_SELECTOR);
  cursor.classList.toggle('pixel-cursor--pointer', Boolean(interactiveTarget));
}

function createClickBurst(event) {
  const burst = document.createElement('span');
  burst.className = 'pixel-click';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.setProperty('--click-x', `${event.clientX}px`);
  burst.style.setProperty('--click-y', `${event.clientY}px`);
  document.body.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove(), { once: true });
}

function animateClick(event) {
  const cursorElement = ensureCursor();
  cursorElement.classList.add('pixel-cursor--click');
  createClickBurst(event);

  window.clearTimeout(clickResetTimeout);
  clickResetTimeout = window.setTimeout(() => {
    cursorElement.classList.remove('pixel-cursor--click');
  }, 190);
}

function hideCursor() {
  cursor?.classList.remove('pixel-cursor--visible');
}

function enablePixelCursor() {
  if (!finePointerMedia.matches) return;

  ensureCursor();
  document.documentElement.classList.add('pixel-cursor-enabled');
  window.addEventListener('pointermove', setCursorPosition);
  window.addEventListener('pointermove', updateCursorMode);
  window.addEventListener('pointerdown', animateClick);
  window.addEventListener('pointerleave', hideCursor);
}

function disablePixelCursor() {
  document.documentElement.classList.remove('pixel-cursor-enabled');
  cursor?.remove();
  cursor = undefined;
  window.removeEventListener('pointermove', setCursorPosition);
  window.removeEventListener('pointermove', updateCursorMode);
  window.removeEventListener('pointerdown', animateClick);
  window.removeEventListener('pointerleave', hideCursor);
}

function syncPointerMode() {
  if (finePointerMedia.matches) {
    enablePixelCursor();
  } else {
    disablePixelCursor();
  }
}

syncPointerMode();
finePointerMedia.addEventListener('change', syncPointerMode);
