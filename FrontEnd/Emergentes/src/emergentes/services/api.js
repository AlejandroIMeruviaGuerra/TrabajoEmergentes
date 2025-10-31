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
/** NUEVO: subir CSV */
export async function uploadCsv(file, table = "sensors") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("table", table);

  // OJO: no seteamos Content-Type manualmente;
  // axios lo hace con el boundary correcto.
  const { data } = await api.post("/uploads/csv", fd);
  return data; // { ok: true, inserted: N }
}
export async function uploadCsvMany(files, table = "sensors", onProgress) {
  const tasks = files.map((file, index) =>
    uploadCsv(file, table, {
      onUploadProgress: (evt) => {
        if (!onProgress) return;
        const total = evt.total ?? 0;
        const loaded = evt.loaded ?? 0;
        const percent = total ? Math.round((loaded / total) * 100) : 0;
        onProgress(index, percent);
      },
    })
      .then((res) => ({ status: "fulfilled", value: res }))
      .catch((err) => ({
        status: "rejected",
        reason: err?.response?.data?.message || err.message || "Error",
      }))
  );

  // Devuelve el arreglo con estado por archivo
  return Promise.all(tasks);
}
export async function uploadCsvBulk(files, type) {
  const fd = new FormData();
  if (type) fd.append("type", type);
  files.forEach((f) => fd.append("files", f));
  const { data } = await api.post("/uploads/csv", fd);
  return data; // { ok: true, results: [{ filename, type, inserted }] }
}