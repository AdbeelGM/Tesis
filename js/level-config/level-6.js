export const LEVEL_CONFIG = {
  level: 6,
  categoria: "temporalidad",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "Ubicar acciones en el tiempo",
  objetivo: "Ordenar meses y días para que el usuario pueda decir cuándo ocurre algo.",
  plan: [
    {
      etapa: "Meses",
      categoria: "temporalidad",
      dificultad: 1,
      proposito: "Identifica meses con apoyo antes de escribirlos.",
      mix: {
        multiple_choice: 5,
        true_false: 2,
        text_input: 1,
      },
    },
    {
      etapa: "Días de la semana",
      categoria: "temporalidad",
      dificultad: 1,
      proposito: "Refuerza días, útiles para planes y rutinas.",
      mix: {
        multiple_choice: 4,
        true_false: 2,
        text_input: 1,
      },
    },
  ],
};
