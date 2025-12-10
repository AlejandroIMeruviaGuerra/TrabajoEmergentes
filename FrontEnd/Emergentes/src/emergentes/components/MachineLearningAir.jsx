import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const BACKEND_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

let socket;

const clusterColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28"];
const colorForCluster = (c) => clusterColors[c % clusterColors.length];

const sensorTypes = [
  { value: "air", label: "Sensor Aire", features: ["CO₂ (ppm)", "Temp. (°C)", "Humedad (%)"] },
  { value: "noise", label: "Sensor Ruido", features: ["Decibeles (dB)", "Frecuencia (Hz)", "Presión"] },
  { value: "underground", label: "Sensor Subterráneo", features: ["Humedad (%)", "Temp. (°C)", "pH"] },
];

function MachineLearningAir() {
  const [sensor, setSensor] = useState("air");
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [canPredict, setCanPredict] = useState(false);
  const [sample, setSample] = useState([]);
  const [nClusters, setNClusters] = useState(0);
  const [silhouette, setSilhouette] = useState(null);

  useEffect(() => {
    // Inicializar socket si no existe
    if (!socket) {
      socket = io(BACKEND_URL, {
        transports: ["websocket"],
      });
    }

    socket.on("ml:progress", (payload) => {
      if (payload.sensor !== sensor) return;
      setProgress(payload.progress || 0);
      setStatusMsg(payload.message || "");
    });

    socket.on("ml:done", (payload) => {
      if (payload.sensor !== sensor) return;
      setIsTraining(false);
      setProgress(100);
      setStatusMsg("Entrenamiento finalizado");
      setCanPredict(true);
    });

    socket.on("ml:error", (payload) => {
      if (payload.sensor !== sensor) return;
      setIsTraining(false);
      setStatusMsg("Error en entrenamiento: " + payload.error);
    });

    return () => {
      socket.off("ml:progress");
      socket.off("ml:done");
      socket.off("ml:error");
    };
  }, [sensor]);

  const handleTrain = async () => {
    setIsTraining(true);
    setCanPredict(false);
    setProgress(0);
    setStatusMsg("Lanzando entrenamiento...");

    try {
      const res = await fetch(`${BACKEND_URL}/api/ml/${sensor}/train`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.ok) {
        setIsTraining(false);
        setStatusMsg("No se pudo iniciar el entrenamiento");
      } else {
        const sensorLabel = sensorTypes.find(s => s.value === sensor)?.label || "desconocido";
        setStatusMsg(`Entrenando modelo KMeans para ${sensorLabel}...`);
      }
    } catch (err) {
      console.error(err);
      setIsTraining(false);
      setStatusMsg("Error al llamar al backend");
    }
  };

  const handlePredict = async () => {
    setStatusMsg("Calculando clusters...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/ml/${sensor}/predict`);
      const data = await res.json();
      if (!data.ok) {
        setStatusMsg("No hay modelo entrenado o no hay datos");
        return;
      }

      setSample(
        data.sample.map((s, idx) => ({
          id: idx,
          ...s,
        }))
      );
      setNClusters(data.n_clusters || 0);
      setSilhouette(data.silhouette);
      setStatusMsg("Predicción lista");
    } catch (err) {
      console.error(err);
      setStatusMsg("Error al obtener predicciones");
    }
  };

  // Dataset para grafica de barras de conteo por cluster
  const clusterCounts = React.useMemo(() => {
    const counts = {};
    sample.forEach((s) => {
      counts[s.cluster] = (counts[s.cluster] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cluster, count]) => ({
        cluster: Number(cluster),
        count,
      }))
      .sort((a, b) => a.cluster - b.cluster);
  }, [sample]);

  return (
    <div className="p-6 flex flex-col gap-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">🤖 Machine Learning - Clustering KMeans</h1>

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Sensor</label>
          <select
            value={sensor}
            onChange={(e) => setSensor(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sensorTypes.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleTrain}
          disabled={isTraining}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium transition"
        >
          {isTraining ? "Entrenando..." : "ENTRENAR"}
        </button>

        <button
          onClick={handlePredict}
          disabled={!canPredict}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium transition"
        >
          PREDICIR
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="w-full max-w-2xl bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso</span>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded h-4">
          <div
            className="h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-3 font-medium">{statusMsg}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-600 text-sm font-medium">Clusters</p>
          <p className="text-3xl font-bold text-blue-600">{nClusters || "-"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-600 text-sm font-medium">Silhouette Score</p>
          <p className="text-3xl font-bold text-green-600">
            {silhouette !== null && silhouette !== undefined
              ? silhouette.toFixed(3)
              : "-"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-600 text-sm font-medium">Muestras</p>
          <p className="text-3xl font-bold text-purple-600">{sample.length}</p>
        </div>
      </div>

      {/* GRÁFICAS */}
      {sample.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            {/* Scatter dinámico según sensor */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold mb-4 text-gray-800 text-lg">
                📊 Clusters - {sensorTypes.find(s => s.value === sensor)?.label}
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey={sensor === "air" ? "co2_mean" : sensor === "noise" ? "decibeles_mean" : "moisture_mean"}
                    name={sensorTypes.find(s => s.value === sensor)?.features[0]}
                    label={{ value: sensorTypes.find(s => s.value === sensor)?.features[0], position: "insideBottomRight", offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey={sensor === "air" ? "temperature_mean" : sensor === "noise" ? "frequency_mean" : "temperature_mean"}
                    name={sensorTypes.find(s => s.value === sensor)?.features[1]}
                    label={{ value: sensorTypes.find(s => s.value === sensor)?.features[1], angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Legend />
                  {Array.from(new Set(sample.map((s) => s.cluster))).map(
                    (cluster) => (
                      <Scatter
                        key={cluster}
                        name={`Cluster ${cluster}`}
                        data={sample.filter((s) => s.cluster === cluster)}
                        fill={colorForCluster(cluster)}
                      />
                    )
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Barras count por cluster */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold mb-4 text-gray-800 text-lg">
                📈 Sensores por Cluster
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={clusterCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="cluster"
                    label={{ value: "Cluster", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Sensores"
                    radius={[8, 8, 0, 0]}
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de sensores */}
          <div className="bg-white rounded-xl shadow p-6 mt-4">
            <h2 className="font-bold mb-4 text-gray-800 text-lg">
              📋 Detalle de Sensores
            </h2>
            <div className="max-h-96 overflow-auto border rounded">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">devEui</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Ubicación</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">CO₂ medio</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Temp. media</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Humedad media</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Cluster</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-mono text-xs">{s.devEui}</td>
                      <td className="px-4 py-3 text-gray-700">{s.location_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{s.co2_mean?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">{s.temperature_mean?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">{s.humidity_mean?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-3 py-1 rounded-full text-white font-semibold text-sm"
                          style={{ backgroundColor: colorForCluster(s.cluster) }}
                        >
                          {s.cluster}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MachineLearningAir;
