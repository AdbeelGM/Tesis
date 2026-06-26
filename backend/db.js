/**
 * @file db.js
 * @description Crea y exporta el pool de conexiones MySQL compartido por las rutas y servicios del backend de LSM Gamificada.
 * @module AccesoADatos
 */
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "lsm_gamificada",
  waitForConnections: true,
  connectionLimit: 10
});
