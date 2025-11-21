// UndergroundStabilityRadar.jsx
import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function UndergroundStabilityRadar({ porSensor }) {
  if (!porSensor || porSensor.length === 0) {
    return <p style={{ padding: 16 }}>No hay datos de sensores para calcular estabilidad.</p>;
  }

  const data = porSensor.map((s) => {
    const stability = Math.max(
      0,
      100 -
        Math.abs(s.distance_max - s.distance_mean) * 4 - // variación
        (s.distance_mean > 50 ? 30 : 0) // castigo por distancia excesiva
    );

    return {
      devEui: s.devEui,
      stability: Math.round(stability),
    };
  });

  return (
    <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>Estabilidad de Sensores (Radar)</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        La estabilidad se basa en la variación entre distancia máxima y promedio.
      </p>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="#d1d5db" />
            <PolarAngleAxis dataKey="devEui" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Tooltip />

            <Radar
              name="Estabilidad (%)"
              dataKey="stability"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
