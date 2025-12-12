// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

// Conexiones
import { connectMySQL, pool as mysqlPool } from "./config/db_mysql.js";
import { connectMongo } from "./config/db_mongo.js";
import mongoose from "mongoose";

// Rutas
import sensorsRoutes from "./routes/sensors.routes.js";
import authRoutes from "./routes/auth.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import healthRoutes from "./routes/health.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import noiseReports from "./routes/noise.routes.js";
import undergroundReports from "./routes/underground.routes.js";
// ML
import mlRoutes from "./routes/ml.routes.js"

// Kafka
import { startConsumer, setSocketIO, stopConsumer } from "./kafka/consumer.js";
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
app.use("/api/health", healthRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/reports/noise", noiseReports);
app.use("/api/reports/underground", undergroundReports);
app.use("/api/ml", mlRoutes);

// Healthcheck legacy (mantener por compatibilidad, pero usar /api/health/)
app.get("/health", (_req, res) => {
  res.json({ ok: true, msg: "Servidor operativo (usar /api/health para check completo)", ts: Date.now() });
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

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} recibido, cerrando servidor...`);
  
  try {
    // Cerrar servidor HTTP
    server.close(() => {
      console.log("✅ Servidor HTTP cerrado");
    });
    
    // Desconectar Kafka consumer
    await stopConsumer();
    
    // Cerrar conexiones DB
    if (mysqlPool) {
      await mysqlPool.end();
      console.log("✅ MySQL desconectado");
    }
    
    if (mongoose.connection) {
      await mongoose.connection.close();
      console.log("✅ MongoDB desconectado");
    }
    
    console.log("👋 Shutdown completado");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
