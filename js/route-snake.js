/**
 * @file route-snake.js
 * @description Conserva los desplazamientos horizontales declarados en cada nodo de nivel para que la ruta visual mantenga su forma serpenteante al cargar la página.
 * @module Ruta
 */
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.level-item');
  items.forEach((item) => {
    const inlineOffset = item.style.getPropertyValue('--offset-x');
    if (inlineOffset) {
      item.style.setProperty('--offset-x', inlineOffset);
    }
  });
});
