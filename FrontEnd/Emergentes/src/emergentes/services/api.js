// src/emergentes/services/api.js
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

// ---- Datos para dashboard tiempo real (semilla inicial) ----
export async function fetchByType(type) {
  const { data } = await api.get(`/sensors/${type}`);
  // Normaliza a { t, ... } para graficar
  return (data?.data || [])
    .reverse()
    .map((d) => ({
      t: d.timestamp || d.createdAt || Date.now(),
      pm25: d.pm25,
      pm10: d.pm10,
      co2: d.co2,
      decibels: d.decibels,
      humidity: d.humidity,
      temperature: d.temperature,
    }));
}

// ---- Histórico paginado con filtros ----
export async function fetchSensorsPaged(type, params) {
  // params: { page, limit, from, to, devEui, order }
  const { data } = await api.get(`/sensors/${type}`, { params });
  // data = { ok, data: [..], meta: {...} }
  return data;
}

// (opcional) agregados 1m cuando esté listo el backend
export async function fetchSensorsAvg1m(type, params) {
  const { data } = await api.get(`/sensors/${type}/avg1m`, { params });
  return data;
}

// ---- Upload tradicional (por si lo sigues usando en backend) ----
export async function uploadCsvBulk(files, type) {
  const fd = new FormData();
  if (type) fd.append("type", type);
  files.forEach((f) => fd.append("files", f));
  const { data } = await api.post("/uploads/csv", fd);
  return data; // { ok: true, results: [{ filename, type, inserted }] }
}

// ================== NUEVO: UPLOAD POR CHUNKS ==================
// ================== NUEVO: UPLOAD POR CHUNKS ==================

// 1) init
export async function uploadInit({ filename, size, type }) {
  const { data } = await api.post("/uploads/init", {
    filename,
    size,
    type,
  });

  // Backend devuelve { ok, id, chunkSize, parts }
  return {
    ok: data.ok,
    uploadId: data.id,             // 👈 mapeado correctamente
    chunkSize: data.chunkSize,
    totalChunks: data.parts,       // 👈 mapeado correctamente
  };
}

// 2) subir chunk (PUT /uploads/chunk/:id/:part)
export async function uploadChunk({ uploadId, chunkIndex, blob }) {
  const url = `${API}/api/uploads/chunk/${uploadId}/${chunkIndex}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: blob,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || "Error al enviar chunk");
  }

  return await res.json();
}

// 3) complete (POST /uploads/complete/:id)
export async function uploadComplete({ uploadId }) {
  const { data } = await api.post(`/uploads/complete/${uploadId}`);
  return data;
}

// --- Reportes avanzados ---
// GET /api/reports/air/overview
export async function fetchAirOverview(params = {}) {
  const { data } = await api.get("/reports/air/overview", { params });
  return data; // { ok, evolucion, porSensor, histograma }
}


/*// 1) init
export async function uploadInit({ filename, size, type }) {
  const { data } = await api.post("/uploads/init", {
    filename,
    size,
    type,
  });
  // Esperado: { ok, uploadId, chunkSize, totalChunks }
  return data;
}

// 2) subir chunk
export async function uploadChunk({ uploadId, chunkIndex, totalChunks, blob }) {
  const fd = new FormData();
  fd.append("chunk", blob);
  fd.append("uploadId", uploadId);
  fd.append("chunkIndex", String(chunkIndex));
  fd.append("totalChunks", String(totalChunks));

  const { data } = await api.post("/uploads/chunk", fd);
  return data;
}

// 3) complete
export async function uploadComplete({ uploadId }) {
  const { data } = await api.post("/uploads/complete", { uploadId });
  return data; // { ok, message, summary? }
}*/


