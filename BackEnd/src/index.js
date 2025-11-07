// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

// Conexiones
import { connectMySQL } from "./config/db_mysql.js";
import { connectMongo } from "./config/db_mongo.js";

// Rutas
import sensorsRoutes from "./routes/sensors.routes.js";
import authRoutes from "./routes/auth.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";

// Kafka
import { startConsumer, setSocketIO } from "./kafka/consumer.js";
// import { sendMockData } from "./kafka/producer.js"; // opcional

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: { origin: "*" },
});

// Middlewares
app.use(cors());
app.use(express.json()); // para JSON (uploads por chunk usan express.raw en su propia ruta)

// Rutas
app.use("/api/sensors", sensorsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadsRoutes);

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, msg: "Servidor operativo", ts: Date.now() });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);
  socket.on("disconnect", () => console.log("🔴 Cliente desconectado:", socket.id));
});

// Exponer io para que servicios/rutas lo usen (uploads.complete lo lee con req.app.get("io"))
app.set("io", io);

// Arranque ordenado
(async () => {
  try {
    // 1) DBs
    await connectMySQL();     // <-- NECESARIO para que ingesta inserte
    await connectMongo();  // opcional; actívalo si ya tienes Atlas permitido

    // 2) Kafka consumer (después de DB y IO)
    setSocketIO(io);
    await startConsumer();

    // 3) Server HTTP
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });

    // Opcional: mocks locales
    // sendMockData();

  } catch (err) {
    console.error("❌ Error al iniciar la app:", err.message);
    process.exit(1);
  }
})();
