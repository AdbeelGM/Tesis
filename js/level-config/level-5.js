export const LEVEL_CONFIG = {
  level: 5,
  seccion: 1,
  bloque: "Fundamentos",
  categoria: "colores y vestimenta",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "Describir objetos y ropa",
  objetivo: "Combinar colores con vestimenta tiene propósito descriptivo: decir qué prenda es y cómo se ve.",
  plan: [
    {
      etapa: "Colores como atributos",
      categoria: "colores",
      dificultad: 1,
      proposito: "Reconoce colores para usarlos como descriptores.",
      mix: {
        multiple_choice: 5,
        true_false: 2,
        text_input: 1,
      },
    },
    {
      etapa: "Prendas cotidianas",
      categoria: "vestimenta",
      dificultad: 1,
      proposito: "Nombra prendas para formar descripciones simples.",
      mix: {
        multiple_choice: 5,
        true_false: 1,
        text_input: 1,
      },
    },
  ],
};
