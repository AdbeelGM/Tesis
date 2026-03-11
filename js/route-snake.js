document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.level-item');
  items.forEach((item) => {
    const inlineOffset = item.style.getPropertyValue('--offset-x');
    if (inlineOffset) {
      item.style.setProperty('--offset-x', inlineOffset);
    }
  });
});
