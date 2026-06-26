/**
 * @file db.js
 * @description Crea y exporta el pool de conexiones MySQL compartido por las rutas y servicios del backend de LSM Gamificada.
 * @module AccesoADatos
 */
import mysql from "mysql2/promise";

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "root",
  DB_NAME = "lsm_gamificada",
} = process.env;

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: true,
});
