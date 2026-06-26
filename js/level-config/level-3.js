/**
 * @file level-3.js
 * @description Define la configuración pedagógica del nivel 3: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 3,
  categorias: ['abecedario', 'numeros', 'colores'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Asociación de vocabulario inicial.",
  objetivo: "Relacionar letras, números y colores para ampliar memoria visual y semántica.",
  mix: {
    multiple_choice: 8,
    true_false: 5,
    text_input: 2,
  },
};
