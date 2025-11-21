import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function NoisePeakTimeline({ evolucion, threshold = 70 }) {
  if (!evolucion || evolucion.length === 0)
    return <div style={{ padding: 20 }}>Sin datos para línea de picos.</div>;

  const data = evolucion.map(d => ({
    tLabel: new Date(d.t).toLocaleString("es-BO"),
    laeq: d.laeq,
    laimax: d.laimax,
    peak: d.laimax > threshold ? d.laimax : null
  }));

  return (
    <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
      <h2>Línea de Tiempo de Picos Acústicos</h2>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Muestra cuándo ocurren los eventos acústicos que superan {threshold} dB.
      </p>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tLabel" minTickGap={40} />
            <YAxis />
            <Tooltip />

            {/* Línea base */}
            <Line
              type="monotone"
              dataKey="laeq"
              name="LAeq"
              stroke="#3b82f6"
              dot={false}
            />

            {/* Picos */}
            <Line
              type="monotone"
              dataKey="peak"
              name="Picos LAmax"
              stroke="#ef4444"
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
