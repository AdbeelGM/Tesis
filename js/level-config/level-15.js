/**
 * @file level-15.js
 * @description Define la configuración pedagógica del nivel 15: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 15,
  categorias: ['continentespaises', 'transportes', 'tecnologia', 'proteccioncivil', 'ambitojuridico'],
  dificultad: [1, 2, 3],
  totalEjercicios: 15,
  enfoque: "Cierre integral por contexto.",
  objetivo: "Evaluar dominio integral con énfasis en recuerdo activo de vocabulario social, geográfico y legal.",
  mix: {
    multiple_choice: 4,
    true_false: 4,
    text_input: 7,
  },
};
