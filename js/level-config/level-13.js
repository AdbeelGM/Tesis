/**
 * @file level-13.js
 * @description Define la configuración pedagógica del nivel 13: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 13,
  categorias: ['continentespaises', 'transportes', 'tecnologia', 'proteccioncivil'],
  dificultad: [1, 2],
  totalEjercicios: 15,
  enfoque: "Contexto público y seguridad.",
  objetivo: "Integrar términos de prevención y transporte con variación de dificultad para comprensión aplicada.",
  mix: {
    multiple_choice: 7,
    true_false: 5,
    text_input: 3,
  },
};
