import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Conexión única (singleton)
export const socket = io(API, {
  transports: ["websocket"],
  autoConnect: true,
});
