/**
 * @file level-2.js
 * @description Define la configuración pedagógica del nivel 2: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 2,
  categorias: ['abecedario', 'numeros'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Transferencia a símbolos básicos.",
  objetivo: "Combinar letras y números para fortalecer identificación rápida de señas frecuentes.",
  mix: {
    multiple_choice: 10,
    true_false: 4,
    text_input: 1,
  },
};
