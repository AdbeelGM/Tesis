export const LEVEL_CONFIG = {
  level: 15,
  seccion: 3,
  bloque: "Especialización temática",
  categoria: "repaso integrador",
  dificultad: 3,
  totalEjercicios: 15,
  enfoque: "Usar vocabulario con intención comunicativa",
  objetivo: "Cerrar con bloques relacionados: presentarse, describir, ubicarse y pedir ayuda; cada mezcla tiene una función comunicativa.",
  plan: [
    {
      etapa: "Presentarse",
      categorias: ["saludos", "pronombres", "familia"],
      dificultad: 3,
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
      dificultad: 3,
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
      dificultad: 3,
      proposito: "Relaciona tiempo, traslado y necesidad de apoyo en situaciones reales.",
      mix: {
        multiple_choice: 3,
        true_false: 1,
        text_input: 1,
      },
    },
  ],
};
