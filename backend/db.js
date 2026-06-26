/**
 * @file db.js
 * @description Crea y exporta el pool de conexiones MySQL compartido por las rutas y servicios del backend de LSM Gamificada.
 * @module AccesoADatos
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
