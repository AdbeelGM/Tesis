/*
 * Nombre: route-snake.js
 * Descripción: Contiene estilos o lógica de soporte para route-snake.
 * Módulo: Proyecto LSM Gamificada
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
