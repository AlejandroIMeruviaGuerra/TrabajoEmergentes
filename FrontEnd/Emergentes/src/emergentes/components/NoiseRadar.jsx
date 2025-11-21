import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip, ResponsiveContainer
} from "recharts";

export default function NoiseRadar({ porSensor }) {
  if (!porSensor || porSensor.length === 0)
    return <div style={{ padding: 20 }}>Sin datos de sensores.</div>;

  // Normalizamos porSensor → necesita laeq_mean, lai_mean, laimax_mean
  const data = porSensor.map(s => ({
    devEui: s.devEui,
    LAeq: Number(s.laeq_mean || 0),
    LAi: Number(s.lai_mean || 0),
    LAmax: Number(s.laimax_mean || 0)
  }));

  return (
    <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>Perfil Acústico por Sensor (Radar Chart)</h2>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Comparación visual del comportamiento sonoro promedio por sensor.
      </p>

      <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="devEui" />
            <PolarRadiusAxis angle={90} />
            <Radar name="LAeq" dataKey="LAeq" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
            <Radar name="LAi" dataKey="LAi" stroke="#dc2626" fill="#dc2626" fillOpacity={0.4} />
            <Radar name="LAmax" dataKey="LAmax" stroke="#16a34a" fill="#16a34a" fillOpacity={0.4} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
