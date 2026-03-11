document.addEventListener('DOMContentLoaded', () => {
  const offsets = [86, -76, 0, 98, -60, 0];
  const items = document.querySelectorAll('.route__path .level-item');

  items.forEach((item, index) => {
    const offset = offsets[index] ?? 0;
    item.style.setProperty('--offset-x', `${offset}px`);
  });
});
