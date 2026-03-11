document.addEventListener('DOMContentLoaded', () => {
  const nodes = document.querySelectorAll('.level-node');

  const amplitud = 50;   // qué tanto se mueve hacia los lados (px)
  const paso = 1;     // controla cada cuántos niveles gira la curva
                         // valores más pequeños = curvas más largas

  nodes.forEach((node, index) => {
    // curva suave tipo seno: 0 → derecha → centro → izquierda → centro...
    const offset = Math.sin(index * paso) * amplitud;
    node.style.setProperty('--offset-x', `${offset}px`);
  });
});
