CREATE TABLE numeros(
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_tipo      ENUM('imagen','video','youtube') NOT NULL DEFAULT 'imagen',
  media_fuente    VARCHAR(500) NOT NULL,      -- ruta local o URL (incluye YouTube)
  respuesta       VARCHAR(100) NOT NULL,      -- respuesta principal (ej. '1' o 'uno')
  respuesta_alt   VARCHAR(100) NULL,          -- respuesta alternativa aceptada (ej. 'uno' o '1')
  dificultad      TINYINT UNSIGNED NOT NULL   -- 1 = fácil, 2 = medio, 3 = difícil
);
