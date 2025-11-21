// src/emergentes/components/UndergroundTrendSmooth.jsx
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

/**
 * Esta gráfica aplica un alisado (moving average)
 * para crear una tendencia clara de las distancias.
 *
 * NO requiere cambios en backend.
 */

export default function UndergroundTrendSmooth({ evolucion }) {
  if (!evolucion || evolucion.length < 5) {
    return <p style={{ padding: 16 }}>No hay suficientes datos para tendencia.</p>;
  }

  // Generar labels y formatear tiempo
  const raw = evolucion.map((d) => ({
    ...d,
    tLabel: new Date(d.t).toLocaleString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  // Calcular promedio móvil (window de 8 puntos)
  const windowSize = 8;
  const smooth = raw.map((d, index) => {
    const start = Math.max(0, index - windowSize);
    const slice = raw.slice(start, index + 1);

    const smoothVal =
      slice.reduce((sum, p) => sum + p.distance, 0) / slice.length;

    return {
      ...d,
      smooth: Number(smoothVal.toFixed(2)),
    };
  });

  return (
    <section
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
      }}
    >
      <h2>Tendencia Suavizada de Distancia</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Línea suavizada mediante promedio móvil.  
        Permite identificar patrones reales sin ruido.
      </p>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <LineChart data={smooth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tLabel" minTickGap={48} />
            <YAxis
              label={{
                value: "Distancia (cm)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />

            {/* Línea original (suave) */}
            <Line
              type="monotone"
              dataKey="distance"
              name="Original"
              stroke="#9ca3af"
              dot={false}
              strokeWidth={1}
            />

            {/* Línea suavizada */}
            <Line
              type="monotone"
              dataKey="smooth"
              name="Tendencia Suavizada"
              stroke="#2563eb"
              dot={false}
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
