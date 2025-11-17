// src/emergentes/components/Historico.jsx
import { useEffect, useState } from "react";
import { fetchSensorsPaged } from "../services/api";
import SensorChart from "./SensorChart";

const TYPES = [
  { id: "air", label: "Calidad de Aire" },
  { id: "noise", label: "Ruido" },
  { id: "underground", label: "Soterrado" },
];

export default function Historico() {
  const [type, setType] = useState("air");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [devEui, setDevEui] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  const loadData = async (opts) => {
    const params = {
      page: opts?.page ?? page,
      limit,
      from: from || undefined,
      to: to || undefined,
      devEui: devEui || undefined,
    };

    setLoading(true);
    setError("");
    try {
      const res = await fetchSensorsPaged(type, params);
      if (!res.ok) {
        throw new Error(res.message || "Error en la consulta");
      }
      setRows(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const chartData = rows.map((d) => ({
    t: d.time || d.timestamp || d.createdAt || Date.now(),
    pm25: d.pm25,
    pm10: d.pm10,
    co2: d.co2,
    decibels: d.decibels,
    humidity: d.humidity,
    temperature: d.temperature,
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>
        Histórico de mediciones
      </h1>

      {/* Filtros */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Tipo</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            >
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Desde
            </label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Hasta
            </label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              devEui (opcional)
            </label>
            <input
              value={devEui}
              onChange={(e) => setDevEui(e.target.value)}
              placeholder="24e124..."
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Registros por página
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadData({ page: 1 });
            }}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {loading ? "Buscando..." : "Aplicar filtros"}
          </button>
        </div>

        {meta && (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Total: {meta.total} registros — página {meta.currentPage} de{" "}
            {meta.pages}
          </div>
        )}
      </section>

      {/* Chart */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <SensorChart
          data={chartData}
          series={[
            { key: "pm25", label: "PM2.5" },
            { key: "pm10", label: "PM10" },
            { key: "co2", label: "CO₂" },
            { key: "decibels", label: "Ruido (dB)" },
            { key: "humidity", label: "Humedad (%)" },
            { key: "temperature", label: "Temperatura (°C)" },
          ]}
          yLabel="Valor"
        />
      </section>

      {/* Tabla */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            overflowX: "auto",
            marginBottom: 12,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  time
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  devEui
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  pm25
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  pm10
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  co2
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  dB
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  humidity
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                  temperature
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      padding: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.time || r.timestamp || r.createdAt}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      padding: 6,
                    }}
                  >
                    {r.devEui}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                    {r.pm25 ?? "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                    {r.pm10 ?? "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                    {r.co2 ?? "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                    {r.decibels ?? "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                    {r.humidity ?? "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                    {r.temperature ?? "-"}
                  </td>
                </tr>
              ))}

              {!rows.length && !loading && (
                <tr>
                  <td colSpan={8} style={{ padding: 8, textAlign: "center" }}>
                    Sin datos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <button
              type="button"
              disabled={!meta.hasPrev || loading}
              onClick={() => {
                const newPage = meta.currentPage - 1;
                setPage(newPage);
                loadData({ page: newPage });
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor:
                  !meta.hasPrev || loading ? "not-allowed" : "pointer",
              }}
            >
              Anterior
            </button>

            <span>
              Página {meta.currentPage} de {meta.pages}
            </span>

            <button
              type="button"
              disabled={!meta.hasNext || loading}
              onClick={() => {
                const newPage = meta.currentPage + 1;
                setPage(newPage);
                loadData({ page: newPage });
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor:
                  !meta.hasNext || loading ? "not-allowed" : "pointer",
              }}
            >
              Siguiente
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
