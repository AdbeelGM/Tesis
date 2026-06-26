/**
 * @file level-6.js
 * @description Define la configuración pedagógica del nivel 6: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 6,
  categorias: ['saludos', 'familia'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Comunicación cotidiana inicial.",
  objetivo: "Empezar interacción social con saludos y familia usando apoyo alto de reconocimiento.",
  mix: {
    multiple_choice: 11,
    true_false: 3,
    text_input: 1,
  },
};
