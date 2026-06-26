/*
 * Nombre: db.js
 * Descripción: Centraliza el pool de conexión a MySQL usado por las rutas backend.
 * Módulo: Backend / Acceso a datos
 */
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "lsm_gamificada",
  waitForConnections: true,
  connectionLimit: 10
});
