// src/emergentes/components/AirReports.jsx
import { useEffect, useState } from "react";
import { fetchAirOverview } from "../../emergentes/services/api.js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  BarChart, Bar, ResponsiveContainer,
} from "recharts";

export default function AirReports() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [devEuiFilter, setDevEuiFilter] = useState("");
  const [days, setDays] = useState(3); // últimos 3 días por defecto

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // rango de fechas simple: hoy - days
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - days);

        const params = {
          from: from.toISOString().slice(0, 19).replace("T", " "),
          to: to.toISOString().slice(0, 19).replace("T", " "),
        };
        if (devEuiFilter) params.devEui = devEuiFilter;

        const data = await fetchAirOverview(params);
        if (!data.ok) throw new Error(data.msg || "Error en reporte");

        setOverview(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error cargando reporte");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [devEuiFilter, days]);

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando reporte de aire...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: "#b91c1c" }}>{error}</div>;
  }

  if (!overview) {
    return <div style={{ padding: 24 }}>Sin datos para mostrar.</div>;
  }

  const { evolucion, porSensor, histograma } = overview;

  // Formatear timestamps a algo más corto
  const evoData = evolucion.map((d) => ({
    ...d,
    tLabel: new Date(d.t).toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 16px" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 4 }}>Reportes de Calidad de Aire</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Análisis histórico usando datos agregados (ventanas de 1 minuto).
        </p>
      </header>

      {/* Filtros simples */}
      <section
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Días hacia atrás
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ padding: 6, borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            <option value={1}>1 día</option>
            <option value={3}>3 días</option>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Filtrar por devEui (opcional)
          </label>
          <input
            value={devEuiFilter}
            onChange={(e) => setDevEuiFilter(e.target.value)}
            placeholder="eui-XXXX..."
            style={{
              padding: 6,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              minWidth: 220,
            }}
          />
        </div>
      </section>

      {/* 1) Evolución temporal */}
      <section
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ marginBottom: 4, fontSize: 16 }}>
          Evolución de CO₂, Temperatura y Humedad
        </h2>
        <p style={{ marginTop: 0, fontSize: 13, color: "#6b7280" }}>
          Promedios por minuto en el rango de fechas seleccionado.
        </p>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={evoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tLabel" minTickGap={32} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="co2" name="CO₂ (ppm)" dot={false} />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temp (°C)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                name="Humedad (%)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2) Promedio por sensor */}
      <section
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ marginBottom: 4, fontSize: 16 }}>
          CO₂ promedio por sensor
        </h2>
        <p style={{ marginTop: 0, fontSize: 13, color: "#6b7280" }}>
          Sensores con mayor concentración promedio de CO₂.
        </p>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={porSensor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="devEui" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="co2_mean" name="CO₂ promedio (ppm)" />
              <Bar dataKey="co2_max" name="CO₂ máximo (ppm)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3) Histograma de CO2 */}
      <section
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ marginBottom: 4, fontSize: 16 }}>
          Distribución de CO₂ (Histograma)
        </h2>
        <p style={{ marginTop: 0, fontSize: 13, color: "#6b7280" }}>
          Conteo de ventanas por rango de concentración.
        </p>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={histograma}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bin_start"
                tickFormatter={(v) => `${v}-${v + 199}`}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name, props) => [
                  value,
                  `Conteo (${props.payload.bin_start}-${props.payload.bin_end} ppm)`,
                ]}
              />
              <Bar dataKey="count" name="Ventanas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
