export const LEVEL_CONFIG = {
  level: 2,
  categoria: "abecedario y números",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "De símbolos aislados a secuencias cortas",
  objetivo: "Relacionar letras y números porque ambos son signos breves y permiten entrenar precisión visual sin vocabulario largo.",
  plan: [
    {
      etapa: "Recordar letras",
      categoria: "abecedario",
      dificultad: 1,
      proposito: "Recupera letras después del reconocimiento inicial.",
      mix: {
        multiple_choice: 4,
        true_false: 2,
        text_input: 2,
      },
    },
    {
      etapa: "Introducir números",
      categoria: "numeros",
      dificultad: 1,
      proposito: "Pasa a cantidades básicas manteniendo apoyo de opciones.",
      mix: {
        multiple_choice: 5,
        true_false: 1,
        text_input: 1,
      },
    },
  ],
};
