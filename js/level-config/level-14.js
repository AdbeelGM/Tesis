/**
 * @file level-14.js
 * @description Define la configuración pedagógica del nivel 14: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 14,
  categorias: ['continentespaises', 'transportes', 'tecnologia', 'proteccioncivil', 'ambitojuridico'],
  dificultad: [1, 2, 3],
  totalEjercicios: 15,
  enfoque: "Vocabulario ciudadano avanzado.",
  objetivo: "Escalar a términos jurídicos y de seguridad, manteniendo progresión pedagógica con apoyo parcial.",
  mix: {
    multiple_choice: 6,
    true_false: 4,
    text_input: 5,
  },
};
