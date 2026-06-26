/**
 * @file level-5.js
 * @description Define la configuración pedagógica del nivel 5: categorías de vocabulario LSM, dificultad, cantidad total de ejercicios, objetivo didáctico y mezcla de tipos de pregunta.
 * @module ConfiguraciónDeNiveles
 */
export const LEVEL_CONFIG = {
  level: 5,
  categorias: ['abecedario', 'numeros', 'colores'],
  dificultad: [1, 2],
  totalEjercicios: 15,
  enfoque: "Cierre autónomo de fundamentos.",
  objetivo: "Cerrar sección básica con mayor recuerdo activo y escritura para comprobar dominio inicial.",
  mix: {
    multiple_choice: 5,
    true_false: 4,
    text_input: 6,
  },
};
