// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

// Importar conexiones
import { connectMySQL } from "./config/db_mysql.js";
import { connectMongo } from "./config/db_mongo.js";

// Importar rutas
import sensorsRoutes from "./routes/sensors.routes.js";

// 
import { startConsumer, setSocketIO } from "./kafka/consumer.js";
import { sendMockData } from "./kafka/producer.js";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*", // luego puedes restringir a tu frontend
  },
});

app.use(cors());
app.use(express.json());
app.use("/api/sensors", sensorsRoutes);

// Ruta base de prueba
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, msg: "Servidor operativo", ts: Date.now() });
});

// WebSocket conexión
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);
  socket.on("disconnect", () => console.log("🔴 Cliente desconectado:", socket.id));
});

// Conexiones a bases de datos
setSocketIO(io);
connectMySQL();
connectMongo();

startConsumer();   // escucha mensajes


// Puerto del servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});



