export const LEVEL_CONFIG = {
  level: 8,
  seccion: 2,
  bloque: "Comunicación cotidiana",
  categoria: "profesiones",
  dificultad: 2,
  totalEjercicios: 15,
  enfoque: "Roles y ocupaciones",
  objetivo: "Aprender oficios y profesiones para ampliar conversaciones sobre identidad y actividades.",
  plan: [
    {
      etapa: "Profesiones frecuentes",
      categoria: "profesiones",
      dificultad: 2,
      proposito: "Reconoce ocupaciones con apoyo gradual.",
      mix: {
        multiple_choice: 8,
        true_false: 3,
        text_input: 2,
      },
    },
    {
      etapa: "Profesiones con seña menos transparente",
      categoria: "profesiones",
      dificultad: 2,
      proposito: "Introduce dificultad 2 sólo al final para no saturar.",
      mix: {
        multiple_choice: 1,
        true_false: 1,
        text_input: 0,
      },
    },
  ],
};
