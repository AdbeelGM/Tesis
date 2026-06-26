/**
 * @file level-12.js
 * @description Define la configuración pedagógica del nivel 12: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 12,
  categorias: ['continentespaises', 'transportes', 'tecnologia'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Entorno moderno y movilidad.",
  objetivo: "Combinar geografía, movilidad y tecnología para ampliar vocabulario contextual.",
  mix: {
    multiple_choice: 8,
    true_false: 5,
    text_input: 2,
  },
};
