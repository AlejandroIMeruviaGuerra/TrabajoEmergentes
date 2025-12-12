import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PlotClusters({ data = [], features = [] }) {
  if (!data.length || features.length < 2) {
    return <p className="text-gray-500">No hay datos suficientes para graficar.</p>;
  }

  const [f1, f2] = features;

  const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="w-full h-[380px] mt-6 bg-white shadow rounded p-4">
      <h2 className="text-lg font-bold mb-2">Distribución de Clusters</h2>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={f1} name={f1} />
          <YAxis dataKey={f2} name={f2} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />

          {[0, 1, 2, 3].map((cluster) => {
            const items = data.filter((d) => d.cluster === cluster);
            if (items.length === 0) return null;

            return (
              <Scatter
                key={cluster}
                name={`Cluster ${cluster}`}
                data={items}
                fill={COLORS[cluster]}
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
