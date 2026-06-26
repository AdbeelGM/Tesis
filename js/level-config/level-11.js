/**
 * @file level-11.js
 * @description Define la configuración pedagógica del nivel 11: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 11,
  categorias: ['continentespaises', 'transportes'],
  dificultad: [1],
  totalEjercicios: 15,
  enfoque: "Orientación espacial inicial.",
  objetivo: "Introducir lugares y medios de transporte para interpretar desplazamiento en contextos reales.",
  mix: {
    multiple_choice: 10,
    true_false: 4,
    text_input: 1,
  },
};
