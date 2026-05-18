export const LEVEL_CONFIG = {
  level: 15,
  categoria: "repaso integrador",
  dificultad: 1,
  totalEjercicios: 15,
  enfoque: "Usar vocabulario con intención comunicativa",
  objetivo: "Cerrar con bloques relacionados: presentarse, describir, ubicarse y pedir ayuda; cada mezcla tiene una función comunicativa.",
  plan: [
    {
      etapa: "Presentarse",
      categorias: ["saludos", "pronombres", "familia"],
      dificultad: 1,
      proposito: "Integra saludos, personas y familia para una presentación básica.",
      mix: {
        multiple_choice: 3,
        true_false: 1,
        text_input: 1,
      },
    },
    {
      etapa: "Describir",
      categorias: ["colores", "vestimenta", "profesiones"],
      dificultad: 1,
      proposito: "Combina atributos, ropa y roles para describir personas.",
      mix: {
        multiple_choice: 3,
        true_false: 1,
        text_input: 1,
      },
    },
    {
      etapa: "Orientarse y pedir ayuda",
      categorias: ["temporalidad", "transportes", "salud", "proteccioncivil"],
      dificultad: 1,
      proposito: "Relaciona tiempo, traslado y necesidad de apoyo en situaciones reales.",
      mix: {
        multiple_choice: 3,
        true_false: 1,
        text_input: 1,
      },
    },
  ],
};
