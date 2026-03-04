document.addEventListener("DOMContentLoaded", () => {
  const nodes = document.querySelectorAll(".level-node");

  nodes.forEach((node) => {
    node.addEventListener("click", () => {
      const level = node.dataset.level;

      if (!level) {
        console.warn("Este botón no tiene data-level:", node);
        return;
      }

      const target = `plantilla.html?level=${encodeURIComponent(level)}`;
      console.log("Navegando a:", target);

      window.location.href = target;
    });
  });
});
