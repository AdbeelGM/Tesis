export const LEVEL_CONFIG = {
  level: 7,
  categoria: "transportes y lugares",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "Moverse y ubicar destinos",
  objetivo: "Relacionar transporte con países/continentes sirve para practicar desplazamientos y destinos, no como mezcla aleatoria.",
  plan: [
    {
      etapa: "Medios de transporte",
      categoria: "transportes",
      dificultad: 1,
      proposito: "Reconoce cómo se traslada una persona.",
      mix: {
        multiple_choice: 5,
        true_false: 2,
        text_input: 1,
      },
    },
    {
      etapa: "Destinos geográficos",
      categoria: "continentespaises",
      dificultad: 1,
      proposito: "Identifica lugares para completar la idea de viaje o ubicación.",
      mix: {
        multiple_choice: 4,
        true_false: 2,
        text_input: 1,
      },
    },
  ],
};
