/**
 * @file level-4.js
 * @description Define la configuración pedagógica del nivel 4: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 4,
  categorias: ['abecedario', 'numeros', 'colores'],
  dificultad: [1, 2],
  totalEjercicios: 15,
  enfoque: "Primer reto con variación de dificultad.",
  objetivo: "Introducir ejercicios de dificultad 2 manteniendo base conocida para consolidar precisión.",
  mix: {
    multiple_choice: 6,
    true_false: 5,
    text_input: 4,
  },
};
