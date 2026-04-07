import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// ✅ IMPORTA TU ROUTER (ajusta la ruta si tu archivo está en otro lugar)
import { questionsRouter } from "./routes/questions.js";
import { userRouter } from "./routes/user.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ tu frontend está en la raíz del proyecto (un nivel arriba de /backend)
const FRONTEND_DIR = path.join(__dirname, "..");

// ✅ CORS (útil si tu frontend corre en otro puerto/dominio)
app.use(cors({
  origin: true,
  credentials: true,
}));

// ✅ parseo JSON (por si luego haces POST)
app.use(express.json({ limit: "15mb" }));

// ✅ sirve archivos estáticos del frontend: css/, js/, img/, index.html, plantilla.html, etc.
app.use(express.static(FRONTEND_DIR));

// ✅ monta API
app.use("/api/questions", questionsRouter);
app.use("/api/user", userRouter);

// ✅ ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "login.html"));
});

// ✅ fallback: si piden algo que no es /api, regresamos index.html
// (esto evita que al recargar una ruta "falle" con 404)
// ✅ fallback final (NO usar app.get("*") en tu versión)
app.use((req, res) => {
  // Si es API y no existe, responde 404 JSON
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Ruta API no encontrada" });
  }

  // Para cualquier otra cosa, manda la pantalla de acceso
  return res.sendFile(path.join(FRONTEND_DIR, "login.html"));
});


app.listen(3000, () => console.log("Servidor en http://localhost:3000"));
