/**
 * @file level-8.js
 * @description Define la configuración pedagógica del nivel 8: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 8,
  categorias: ['saludos', 'familia', 'pronombres', 'expresiones'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Interacciones funcionales.",
  objetivo: "Incorporar expresiones frecuentes para aumentar comprensión en diálogos simples.",
  mix: {
    multiple_choice: 8,
    true_false: 4,
    text_input: 3,
  },
};
