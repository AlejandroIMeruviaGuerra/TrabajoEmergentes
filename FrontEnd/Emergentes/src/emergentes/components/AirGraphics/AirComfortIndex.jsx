// AirComfortIndex.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AirComfortIndex({ evolucion }) {

  if (!evolucion || evolucion.length === 0)
    return <p style={{ padding: 16 }}>Sin datos para graficar.</p>;

  const data = evolucion.map((d) => {
    const co2Penalty =
      d.co2 < 800 ? 0 : d.co2 < 1200 ? 20 : d.co2 < 2000 ? 40 : 60;

    const tempPenalty = Math.abs(d.temperature - 24) * 2;
    const humidityPenalty = Math.abs(d.humidity - 50) * 1.5;

    let comfort = 100 - (co2Penalty + tempPenalty + humidityPenalty);
    if (comfort < 0) comfort = 0;

    return {
      ...d,
      comfort: Math.round(comfort),
      tLabel: new Date(d.t).toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  return (
    <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>Índice de Confort Ambiental</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Calculado a partir de CO₂, temperatura y humedad (0 = pobre, 100 = óptimo).
      </p>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tLabel" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="comfort"
              name="Confort (%)"
              stroke="#0ea5e9"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
