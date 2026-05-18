export const LEVEL_CONFIG = {
  level: 9,
  categoria: "salud",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "Necesidades médicas básicas",
  objetivo: "Priorizar vocabulario de salud porque permite expresar síntomas o pedir ayuda.",
  plan: [
    {
      etapa: "Síntomas y atención",
      categoria: "salud",
      dificultad: 1,
      proposito: "Reconoce términos de salud comunes antes del recuerdo escrito.",
      mix: {
        multiple_choice: 8,
        true_false: 3,
        text_input: 2,
      },
    },
    {
      etapa: "Concepto delicado",
      categoria: "salud",
      dificultad: 2,
      proposito: "Presenta una seña de mayor dificultad con apoyo.",
      mix: {
        multiple_choice: 1,
        true_false: 1,
        text_input: 0,
      },
    },
  ],
};
