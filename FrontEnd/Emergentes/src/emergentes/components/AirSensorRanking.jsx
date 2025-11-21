// AirSensorRanking.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AirSensorRanking({ porSensor }) {
  if (!porSensor || porSensor.length === 0) {
    return <p style={{ padding: 16 }}>Sin datos de sensores.</p>;
  }

  const sorted = [...porSensor].sort((a, b) => b.co2_mean - a.co2_mean);

  return (
    <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>Ranking de Sensores por CO₂ Promedio</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Ordenados de mayor a menor concentración promedio de CO₂.
      </p>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <BarChart data={sorted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="devEui" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="co2_mean" name="CO₂ Promedio (ppm)" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
