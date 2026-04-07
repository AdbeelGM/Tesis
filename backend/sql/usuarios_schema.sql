CREATE TABLE IF NOT EXISTS Usuarios (
    usuario VARCHAR(50) PRIMARY KEY,
    `contraseña` VARCHAR(255) NOT NULL,

    vidas INT NOT NULL DEFAULT 5,
    gemas INT NOT NULL DEFAULT 1000,
    etapa INT NOT NULL DEFAULT 1,
    nivel INT NOT NULL DEFAULT 1,

    vidas_actualizado_en DATETIME NULL,
    corazones_ilimitados_desde DATETIME NULL,
    corazones_ilimitados_hasta DATETIME NULL,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    foto_perfil_url VARCHAR(500) NULL,
    foto_perfil LONGBLOB NULL,
    foto_perfil_mime VARCHAR(100) NULL,

    experiencia INT NOT NULL DEFAULT 0,
    progreso INT NOT NULL DEFAULT 0,
    dias_racha INT NOT NULL DEFAULT 0,
    lecciones_terminadas INT NOT NULL DEFAULT 0,
    tiempo_invertido_segundos INT NOT NULL DEFAULT 0
);
