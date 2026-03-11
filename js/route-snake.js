const STANDARD_LAYOUT_OFFSETS = [1, 2, 3, 4, 5, 6];

function applyStandardPathLayout(path) {
  const items = Array.from(path.querySelectorAll('.level-item'));

  items.forEach((item, index) => {
    item.classList.remove('level-item--1', 'level-item--2', 'level-item--3', 'level-item--4', 'level-item--5', 'level-item--6');

    const slot = STANDARD_LAYOUT_OFFSETS[index] ?? ((index % 6) + 1);
    item.classList.add(`level-item--${slot}`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const standardPaths = document.querySelectorAll('.route__path--standard');
  standardPaths.forEach(applyStandardPathLayout);
});
