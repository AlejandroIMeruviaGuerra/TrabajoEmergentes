import React, { useEffect, useState, useMemo } from "react";
import io from "socket.io-client";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

// Backend
const BACKEND_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

let socket;

// Configuración por sensor
const SENSOR_TYPES = {
  air: {
    label: "Aire",
    features: ["co2_mean", "temperature_mean", "humidity_mean"],
    featureLabels: ["CO₂ (ppm)", "Temp (°C)", "Humedad (%)"],
  },
  noise: {
    label: "Ruido",
    features: ["noise_mean", "noise_std", "noise_max"],
    featureLabels: ["Decibeles", "Desv. Std", "Máximo"],
  },
  underground: {
    label: "Soterrado",
    features: ["moisture_mean"],
    featureLabels: ["Humedad (%)"],
  },
};

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7"];

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------

export default function MachineLearning() {
  const [sensor, setSensor] = useState("air");
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [sample, setSample] = useState([]);
  const [silhouette, setSilhouette] = useState(null);
  const [clusters, setClusters] = useState(0);

  // ------------------- SOCKET -------------------------
  useEffect(() => {
    if (!socket) {
      socket = io(BACKEND_URL, { transports: ["websocket"] });
    }

    socket.on("ml:progress", (data) => {
      if (data.sensor !== sensor) return;
      setProgress(data.progress);
      setMsg(data.message);
    });

    socket.on("ml:done", (data) => {
      if (data.sensor !== sensor) return;
      setIsTraining(false);
      setProgress(100);
      setMsg("Entrenamiento completado ✔");
    });

    return () => {
      socket.off("ml:progress");
      socket.off("ml:done");
    };
  }, [sensor]);

  // ------------------- ENTRENAR -----------------------
  const trainModel = async () => {
    setIsTraining(true);
    setProgress(0);
    setMsg("Iniciando entrenamiento...");

    await fetch(`${BACKEND_URL}/api/ml/${sensor}/train`, { method: "POST" });
  };

  // ------------------- PREDECIR -----------------------
  const predict = async () => {
    setMsg("Calculando predicciones...");

    const res = await fetch(`${BACKEND_URL}/api/ml/${sensor}/predict`);
    const data = await res.json();

    if (!data.ok) {
      setMsg("Error obteniendo predicciones");
      return;
    }

    setSample(data.sample || []);
    setClusters(data.n_clusters || 0);
    setSilhouette(data.silhouette || null);
    setMsg("Predicción lista ✔");
  };

  // ------------------- AGRUPAR PARA BARRAS -----------------------
  const clusterCounts = useMemo(() => {
    const counts = {};
    sample.forEach((s) => {
      counts[s.cluster] = (counts[s.cluster] || 0) + 1;
    });
    return Object.entries(counts).map(([cluster, count]) => ({
      cluster: Number(cluster),
      count,
    }));
  }, [sample]);

  const [fx, fy] = SENSOR_TYPES[sensor].features;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ---------------------------- TÍTULO -------------------------- */}
        <h1 style={styles.title}>
          ⚡ Análisis Inteligente – <span style={styles.titleGlow}>Clustering KMeans</span>
        </h1>

        {/* ---------------------------- CONTROL PANEL -------------------------- */}
        <div style={styles.controlPanel}>

          <div style={styles.controlGroup}>
            <label style={styles.label}>Tipo de Sensor</label>
            <select
              value={sensor}
              onChange={(e) => setSensor(e.target.value)}
              style={styles.select}
            >
              {Object.keys(SENSOR_TYPES).map((k) => (
                <option key={k} value={k}>{SENSOR_TYPES[k].label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={trainModel}
            disabled={isTraining}
            style={{
              ...styles.buttonPrimary,
              ...(isTraining ? styles.buttonDisabled : {})
            }}
          >
            {isTraining ? "Entrenando..." : "Entrenar Modelo"}
          </button>

          <button onClick={predict} style={styles.buttonSuccess}>
            Predecir
          </button>

        </div>

        {/* ---------------------------- PROGRESO -------------------------- */}
        <div style={styles.card}>
          <p style={styles.subTitle}>Progreso: {progress}%</p>

          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>

          <p style={styles.msg}>{msg}</p>
        </div>

        {/* ---------------------------- MÉTRICAS -------------------------- */}
        <div style={styles.metricsGrid}>

          <div style={styles.metricCardCyan}>
            <p style={styles.metricLabel}>Clusters</p>
            <p style={styles.metricValue}>{clusters}</p>
          </div>

          <div style={styles.metricCardGreen}>
            <p style={styles.metricLabel}>Silhouette Score</p>
            <p style={styles.metricValue}>{silhouette ? silhouette.toFixed(3) : "-"}</p>
          </div>

          <div style={styles.metricCardPurple}>
            <p style={styles.metricLabel}>Muestras</p>
            <p style={styles.metricValue}>{sample.length}</p>
          </div>

        </div>

        {/* ---------------------------- GRAFICAS -------------------------- */}
        {sample.length > 0 && (
          <>

            {/* SCATTER */}
            <div style={styles.graphCard}>
              <h2 style={styles.graphTitle}>📈 Distribución de Clusters</h2>

              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart>
                  <CartesianGrid stroke="#333" />
                  <XAxis stroke="#ccc" dataKey={fx} />
                  <YAxis stroke="#ccc" dataKey={fy} />
                  <Tooltip />
                  <Legend />

                  {Array.from(new Set(sample.map((s) => s.cluster))).map((cluster) => (
                    <Scatter
                      key={cluster}
                      name={`Cluster ${cluster}`}
                      data={sample.filter((s) => s.cluster === cluster)}
                      fill={COLORS[cluster]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* BARRAS */}
            <div style={styles.graphCard}>
              <h2 style={{ ...styles.graphTitle, color: "#60a5fa" }}>
                📊 Sensores por cluster
              </h2>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clusterCounts}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="cluster" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* INTERPRETACIÓN */}
            <div style={styles.interpretCard}>
              <h2 style={styles.interpretTitle}>📘 Interpretación Automática</h2>

              {Object.entries(
                sample.reduce((acc, s) => {
                  if (!acc[s.cluster]) acc[s.cluster] = [];
                  acc[s.cluster].push(s);
                  return acc;
                }, {})
              ).map(([clusterId, items]) => {

                const avg = (key) =>
                  items.reduce((sum, x) => sum + (x[key] || 0), 0) / items.length;

                const metrics = {
                  co2_prom: avg("co2_mean"),
                  temp_prom: avg("temperature_mean"),
                  hum_prom: avg("humidity_mean"),
                };

                const text = [];

                if (metrics.co2_prom > 1200) text.push("CO₂ elevado (mala ventilación)");
                if (metrics.co2_prom < 600) text.push("CO₂ bajo (buena ventilación)");
                if (metrics.temp_prom > 30) text.push("Temperatura alta");
                if (metrics.hum_prom < 25) text.push("Humedad muy baja");

                if (text.length === 0) text.push("Valores normales.");

                return (
                  <div key={clusterId} style={styles.interpretBox}>
                    <h3 style={styles.interpretCluster}>Cluster {clusterId}</h3>
                    <p style={styles.interpretText}>{text.join(". ")}</p>
                  </div>
                );
              })}
            </div>

          </>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ESTILOS FUTURISTAS
// ---------------------------------------------------------------------------

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background:
      "radial-gradient(circle at top left, #1e293b 0%, #020617 50%, #000 100%)",
    color: "#e2e8f0",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    justifyContent: "center",
  },

  container: {
    width: "1100px",
  },

  title: {
    fontSize: "48px",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: "40px",
  },

  titleGlow: {
    color: "#00f7ff",
    textShadow: "0 0 20px rgba(0,255,255,0.7)",
  },

  // ---------- CONTROL PANEL ----------
  controlPanel: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: "22px",
    background: "rgba(15,23,42,0.55)",
    borderRadius: "20px",
    border: "1px solid rgba(0,255,255,0.3)",
    marginBottom: "30px",
    boxShadow: "0 0 25px rgba(0,255,255,0.25)",
  },

  controlGroup: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    color: "#67e8f9",
    marginBottom: "6px",
  },

  select: {
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #38bdf8",
    outline: "none",
  },

  // ---------- BOTONES ----------
  buttonPrimary: {
    padding: "12px 26px",
    background: "linear-gradient(90deg, #00eaff, #33f8ff)",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 0 20px rgba(0,255,255,0.6)",
  },

  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  buttonSuccess: {
    padding: "12px 26px",
    background: "linear-gradient(90deg, #16ffbd, #11ffaa)",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 0 20px rgba(16,255,180,0.6)",
  },

  // ---------- PROGRESO ----------
  card: {
    background: "rgba(15,23,42,0.55)",
    padding: "22px",
    borderRadius: "20px",
    border: "1px solid rgba(56,189,248,0.3)",
    marginBottom: "25px",
    boxShadow: "0 0 20px rgba(56,189,248,0.15)",
  },

  subTitle: {
    color: "#7dd3fc",
    marginBottom: "8px",
  },

  progressBar: {
    width: "100%",
    height: "12px",
    background: "rgba(30,41,59,0.5)",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #00eaff, #0084ff)",
    transition: "0.3s ease",
    boxShadow: "0 0 10px rgba(0,255,255,0.6)",
  },

  msg: {
    color: "#94a3b8",
    marginTop: "10px",
  },

  // ---------- CARDS MÉTRICAS ----------
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "22px",
    marginBottom: "30px",
  },

  metricCardCyan: {
    padding: "22px",
    borderRadius: "18px",
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(0,255,255,0.3)",
    textAlign: "center",
    boxShadow: "0 0 15px rgba(0,255,255,0.15)",
  },

  metricCardGreen: {
    padding: "22px",
    borderRadius: "18px",
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(16,255,180,0.3)",
    textAlign: "center",
    boxShadow: "0 0 15px rgba(16,255,180,0.15)",
  },

  metricCardPurple: {
    padding: "22px",
    borderRadius: "18px",
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(255,0,255,0.3)",
    textAlign: "center",
    boxShadow: "0 0 15px rgba(255,0,255,0.15)",
  },

  metricLabel: {
    color: "#94a3b8",
  },

  metricValue: {
    fontSize: "42px",
    fontWeight: "900",
    marginTop: "10px",
    textShadow: "0 0 12px rgba(0,255,255,0.7)",
  },

  // ---------- GRAFICAS ----------
  graphCard: {
    background: "rgba(15,23,42,0.55)",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid rgba(0,255,255,0.2)",
    marginBottom: "30px",
    boxShadow: "0 0 25px rgba(0,255,255,0.15)",
  },

  graphTitle: {
    color: "#22d3ee",
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "12px",
  },

  // ---------- INTERPRETACIÓN ----------
  interpretCard: {
    padding: "24px",
    background: "rgba(15,23,42,0.55)",
    borderRadius: "20px",
    border: "1px solid rgba(16,255,180,0.3)",
    boxShadow: "0 0 20px rgba(16,255,180,0.2)",
    marginBottom: "50px",
  },

  interpretTitle: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#4ade80",
    marginBottom: "20px",
  },

  interpretBox: {
    padding: "16px",
    marginBottom: "14px",
    borderRadius: "14px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(16,255,180,0.35)",
    boxShadow: "0 0 15px rgba(16,255,180,0.12)",
  },

  interpretCluster: {
    fontSize: "20px",
    fontWeight: "800",
    marginBottom: "6px",
    color: "#86efac",
  },

  interpretText: {
    color: "#cbd5e1",
    fontSize: "15px",
  },
};
