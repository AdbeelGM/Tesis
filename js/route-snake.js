document.addEventListener('DOMContentLoaded', () => {
  const paths = document.querySelectorAll('.route__path');

  paths.forEach((path) => {
    const items = Array.from(path.querySelectorAll('.level-item'));

    items.forEach((item, index) => {
      const slotClass = `level-item--${index + 1}`;
      if (![...item.classList].some((className) => className.startsWith('level-item--'))) {
        item.classList.add(slotClass);
      }
    });
  });
});
