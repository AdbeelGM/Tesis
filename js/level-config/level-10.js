export const LEVEL_CONFIG = {
  level: 10,
  seccion: 2,
  bloque: "Comunicación cotidiana",
  categoria: "protección civil",
  dificultad: 2,
  totalEjercicios: 15,
  enfoque: "Responder ante emergencias",
  objetivo: "Usar protección civil después de salud para aprender vocabulario de riesgo, prevención y ayuda.",
  plan: [
    {
      etapa: "Riesgos comunes",
      categoria: "proteccioncivil",
      dificultad: 2,
      proposito: "Identifica vocabulario urgente de baja dificultad.",
      mix: {
        multiple_choice: 5,
        true_false: 2,
        text_input: 1,
      },
    },
    {
      etapa: "Acciones de respuesta",
      categoria: "proteccioncivil",
      dificultad: 2,
      proposito: "Sube dificultad con términos de respuesta organizada.",
      mix: {
        multiple_choice: 4,
        true_false: 2,
        text_input: 1,
      },
    },
  ],
};
