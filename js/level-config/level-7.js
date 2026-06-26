/**
 * @file level-7.js
 * @description Define la configuración pedagógica del nivel 7: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 7,
  categorias: ['saludos', 'familia', 'pronombres'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Referencias personales y sociales.",
  objetivo: "Agregar pronombres para formar relaciones básicas entre personas y contextos de saludo.",
  mix: {
    multiple_choice: 9,
    true_false: 4,
    text_input: 2,
  },
};
