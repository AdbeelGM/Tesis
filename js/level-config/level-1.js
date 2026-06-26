/**
 * @file level-1.js
 * @description Define la configuración pedagógica del nivel 1: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 1,
  categorias: ['abecedario'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Base visual del alfabeto.",
  objetivo: "Iniciar con reconocimiento de letras en LSM con apoyo visual alto y respuestas guiadas.",
  mix: {
    multiple_choice: 12,
    true_false: 3,
    text_input: 0,
  },
};
