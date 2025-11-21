// UndergroundBubbleTimeline.jsx
import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function UndergroundBubbleTimeline({ evolucion }) {
  if (!evolucion || evolucion.length === 0) {
    return <p style={{ padding: 16 }}>No hay datos de sensores.</p>;
  }

  // --- 1) Mapear sensores a un eje Y categórico ---
  const sensorIndexMap = {};
  let index = 1;

  evolucion.forEach((d) => {
    if (!sensorIndexMap[d.devEui]) {
      sensorIndexMap[d.devEui] = index++;
    }
  });

  // --- 2) Transformar datos para Recharts ---
  const chartData = evolucion.map((d) => ({
    time: new Date(d.t).getTime(), // eje X en timestamp
    timeLabel: new Date(d.t).toLocaleString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }),
    sensor: sensorIndexMap[d.devEui], // eje Y categórico
    devEui: d.devEui,
    distance: d.distance,
    size: Math.max(8, d.distance * 2), // tamaño de burbuja
    color:
      d.distance < 10
        ? "#22c55e" // verde
        : d.distance < 17
        ? "#eab308" // amarillo
        : "#ef4444", // rojo
  }));

  // --- 3) Array para etiquetar YAxis ---
  const sensorLabels = Object.entries(sensorIndexMap).map(([devEui, pos]) => ({
    value: pos,
    label: devEui,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0].payload;

    return (
      <div
        style={{
          background: "#fff",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      >
        <strong>Sensor:</strong> {d.devEui} <br />
        <strong>Distancia:</strong> {d.distance.toFixed(2)} m <br />
        <strong>Fecha:</strong> {d.timeLabel}
      </div>
    );
  };

  return (
    <section
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
        border: "1px solid #e5e7eb",
      }}
    >
      <h2>Bubble Timeline de Distancias Soterradas</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Cada burbuja representa una medición. Su tamaño indica la distancia, su
        color la categoría, y su posición temporal ayuda a detectar picos o
        anomalías.
      </p>

      <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />

            {/* EJE X - Tiempo */}
            <XAxis
              type="number"
              dataKey="time"
              name="Tiempo"
              tickFormatter={(v) =>
                new Date(v).toLocaleTimeString("es-BO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
              domain={["auto", "auto"]}
              minTickGap={20}
            />

            {/* EJE Y - Categoría por sensor */}
            <YAxis
              type="number"
              dataKey="sensor"
              domain={[1, sensorLabels.length]}
              ticks={sensorLabels.map((t) => t.value)}
              tickFormatter={(v) =>
                sensorLabels.find((s) => s.value === v)?.label || v
              }
            />

            {/* ZAxis controla tamaño de burbuja */}
            <ZAxis dataKey="size" range={[60, 400]} />

            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Scatter
              name="Distancia"
              data={chartData}
              fill="#60a5fa"
              shape="circle"
            />

            {/* Colorear dinámicamente */}
            {chartData.map((p, i) => (
              <Scatter
                key={i}
                data={[p]}
                fill={p.color}
                shape="circle"
                zAxisId={0}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* LEYENDA MANUAL */}
      <div style={{ marginTop: 12, fontSize: 13 }}>
        <strong>Leyenda de colores:</strong>
        <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#22c55e",
                borderRadius: "50%",
                marginRight: 4,
              }}
            ></span>
            Distancia baja (&lt; 10m)
          </span>

          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#eab308",
                borderRadius: "50%",
                marginRight: 4,
              }}
            ></span>
            Distancia media (10-17m)
          </span>

          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#ef4444",
                borderRadius: "50%",
                marginRight: 4,
              }}
            ></span>
            Distancia alta (&gt;= 17m)
          </span>
        </div>
      </div>
    </section>
  );
}
