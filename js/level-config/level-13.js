export const LEVEL_CONFIG = {
  level: 13,
  seccion: 3,
  bloque: "Especialización temática",
  categoria: "ámbito jurídico",
  dificultad: 3,
  totalEjercicios: 15,
  enfoque: "Ciudadanía y trámites",
  objetivo: "Introducir vocabulario jurídico con cuidado, separando términos simples de conceptos abstractos.",
  plan: [
    {
      etapa: "Términos jurídicos base",
      categoria: "ambitojuridico",
      dificultad: 3,
      proposito: "Reconoce palabras frecuentes en trámites o noticias.",
      mix: {
        multiple_choice: 6,
        true_false: 2,
        text_input: 1,
      },
    },
    {
      etapa: "Ajustes y derechos",
      categoria: "ambitojuridico",
      dificultad: 2,
      proposito: "Practica conceptos más largos con apoyo.",
      mix: {
        multiple_choice: 3,
        true_false: 2,
        text_input: 0,
      },
    },
    {
      etapa: "Conceptos extensos",
      categoria: "ambitojuridico",
      dificultad: 3,
      proposito: "Sólo se evalúa reconocimiento para evitar carga excesiva.",
      mix: {
        multiple_choice: 1,
        true_false: 0,
        text_input: 0,
      },
    },
  ],
};
