// NoiseDensityMap.jsx
import React, { useMemo } from "react";

export default function NoiseDensityMap({ evolucion }) {
  if (!evolucion || evolucion.length < 5) {
    return (
      <p style={{ padding: 16, fontSize: 16, color: "#555" }}>
        No hay datos suficientes para generar el mapa de densidad.
      </p>
    );
  }

  // Extraer valores LAeq reales
  const values = evolucion
    .map((e) => Number(e.laeq))
    .filter((v) => !isNaN(v) && v > 0);

  if (values.length === 0) {
    return (
      <p style={{ padding: 16, fontSize: 16, color: "#555" }}>
        No hay valores válidos de ruido para mostrar.
      </p>
    );
  }

  // Configuración dinámica
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const BIN_SIZE = 5; // 5 dB por rango
  const BINS = Math.ceil((maxVal - minVal) / BIN_SIZE);

  // Construir los bins
  const bins = Array.from({ length: BINS }, (_, i) => ({
    binStart: Math.round(minVal + i * BIN_SIZE),
    binEnd: Math.round(minVal + (i + 1) * BIN_SIZE),
    count: 0,
  }));

  // Llenar los bins según LAeq
  values.forEach((v) => {
    const index = Math.floor((v - minVal) / BIN_SIZE);
    if (bins[index]) bins[index].count++;
  });

  const maxCount = Math.max(...bins.map((b) => b.count));

  return (
    <section
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
      }}
    >
      <h2 style={{ marginBottom: 4 }}>Mapa de Densidad por Rango de Decibeles</h2>
      <p style={{ marginTop: 0, fontSize: 13, color: "#6b7280" }}>
        Visualiza cuántas mediciones caen dentro de cada rango de ruido
        (bins de 5 dB). Los colores más intensos indican mayor concentración.
      </p>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 260,
          padding: "20px 10px",
          background: "#f9fafb",
          borderRadius: 12,
        }}
      >
        {bins.map((b, i) => {
          const opacity = b.count / maxCount;

          return (
            <div
              key={i}
              style={{
                width: 30,
                height: `${(b.count / maxCount) * 200}px`,
                backgroundColor: `rgba(34, 197, 94, ${opacity})`,
                borderRadius: 6,
                transition: "0.2s",
                position: "relative",
                cursor: "pointer",
              }}
              title={`Rango: ${b.binStart} - ${b.binEnd} dB\nConteo: ${b.count}`}
            />
          );
        })}
      </div>

      {/* LEYENDA */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 6 }}>Leyenda:</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 20,
              background: "rgba(34,197,94,0.2)",
              borderRadius: 4,
            }}
          />
          <span style={{ fontSize: 13, color: "#444" }}>
            Baja concentración de mediciones
          </span>

          <div
            style={{
              width: 30,
              height: 20,
              background: "rgba(34,197,94,1)",
              borderRadius: 4,
              marginLeft: 20,
            }}
          />
          <span style={{ fontSize: 13, color: "#444" }}>
            Alta concentración de mediciones
          </span>
        </div>
      </div>

      {/* Resumen */}
      <div style={{ marginTop: 12, fontSize: 13, color: "#374151" }}>
        <p>
          <strong>Valor mínimo:</strong> {minVal.toFixed(1)} dB
        </p>
        <p>
          <strong>Valor máximo:</strong> {maxVal.toFixed(1)} dB
        </p>
        <p>
          <strong>Total de mediciones analizadas:</strong> {values.length}
        </p>
      </div>
    </section>
  );
}
