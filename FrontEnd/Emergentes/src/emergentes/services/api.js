import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API}/api`,
});

// Interceptor para incluir el token en todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-access-token"] = token;
  }
  return config;
});

// --- Autenticación ---
export async function login(credentials) {
  const { data } = await api.post("/auth/login", credentials);
  return data;
}

// Carga inicial por tipo
export async function fetchByType(type) {
  const { data } = await api.get(`/sensors/${type}`);
  // Normaliza a { t, ... } para graficar
  return (data?.data || []).reverse().map((d) => ({
    t: d.timestamp || d.createdAt || Date.now(),
    pm25: d.pm25,
    pm10: d.pm10,
    co2: d.co2,
    decibels: d.decibels,
    humidity: d.humidity,
    temperature: d.temperature,
  }));
}
