// AirQualityTriad.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function AirQualityTriad({ evolucion }) {

  if (!evolucion || evolucion.length === 0)
    return <p style={{ padding: 16 }}>Sin datos para graficar.</p>;

  const data = evolucion.map((d) => ({
    ...d,
    tLabel: new Date(d.t).toLocaleString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>Comparativa de CO₂, Temperatura y Humedad</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Relación temporal entre las 3 variables principales de calidad del aire.
      </p>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tLabel" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Line type="monotone" dataKey="co2" name="CO₂ (ppm)" stroke="#0ea5e9" dot={false} />
            <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f97316" dot={false} />
            <Line type="monotone" dataKey="humidity" name="Humedad (%)" stroke="#10b981" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
