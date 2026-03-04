document.addEventListener("DOMContentLoaded", () => {
  const nodes = document.querySelectorAll(".level-node");

  nodes.forEach((node) => {
    node.addEventListener("click", () => {
      const level = Number(node.dataset.level);
      const userState = window.currentUserState;

      if (!level) {
        console.warn("Este botón no tiene data-level:", node);
        return;
      }

      if (!userState) {
        alert("Inicia sesión para acceder a los niveles.");
        return;
      }

      if (level !== Number(userState.level)) {
        alert(`Solo puedes jugar tu nivel actual: ${userState.level}.`);
        return;
      }

      const target = `plantilla.html?level=${encodeURIComponent(level)}`;
      window.location.href = target;
    });
  });
});
