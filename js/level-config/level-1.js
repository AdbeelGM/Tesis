export const LEVEL_CONFIG = {
  level: 1,
  seccion: 1,
  bloque: "Fundamentos",
  categoria: "abecedario",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "Base visual del alfabeto",
  objetivo: "Construir una base: primero reconocer letras aisladas antes de pedir escritura.",
  plan: [
    {
      etapa: "Reconocer letras",
      categoria: "abecedario",
      dificultad: 1,
      proposito: "Identifica letras con apoyo alto; todavía no se exige memoria escrita.",
      mix: {
        multiple_choice: 11,
        true_false: 2,
        text_input: 0,
      },
    },
    {
      etapa: "Verificar correspondencias",
      categoria: "abecedario",
      dificultad: 1,
      proposito: "Contrasta si la seña y la letra coinciden para afinar observación visual.",
      mix: {
        multiple_choice: 0,
        true_false: 2,
        text_input: 0,
      },
    },
  ],
};
