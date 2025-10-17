import { useEffect, useMemo, useReducer, useState } from "react";
import { socket } from "../services/socket";
import { fetchByType } from "../services/api";
import SensorChart from "./SensorChart";

const TYPES = [
  { id: "air", label: "Calidad de Aire" },
  { id: "noise", label: "Ruido" },
  { id: "underground", label: "Soterrado" },
];

// Reducer: mantiene { air:[], noise:[], underground:[] }
function reducer(state, action) {
  switch (action.type) {
    case "INIT_TYPE": {
      const { key, data } = action.payload;
      return { ...state, [key]: data || [] };
    }
    case "PUSH_POINT": {
      const { key, point } = action.payload;
      const next = [...(state[key] || []), point];
      // ventana móvil (máx 200 para histórico local)
      if (next.length > 200) next.shift();
      return { ...state, [key]: next };
    }
    default:
      return state;
  }
}

export default function Dashboard() {
  const [active, setActive] = useState("air");
  const [state, dispatch] = useReducer(reducer, { air: [], noise: [], underground: [] });
  const [connected, setConnected] = useState(false);

  // Carga inicial (REST) por cada tipo
  useEffect(() => {
    TYPES.forEach(async ({ id }) => {
      try {
        const data = await fetchByType(id);
        dispatch({ type: "INIT_TYPE", payload: { key: id, data } });
      } catch (e) {
        console.warn(`No se pudo cargar inicial ${id}`, e?.message);
      }
    });
  }, []);

  // Subscribirse al socket (tiempo real)
  useEffect(() => {
    function onConnect() {
      setConnected(true);
      // console.log("Socket conectado");
    }
    function onDisconnect() {
      setConnected(false);
      // console.log("Socket desconectado");
    }
    function onNewData({ type, value }) {
      const point = {
        t: Date.now(),
        pm25: value.pm25,
        pm10: value.pm10,
        co2: value.co2,
        decibels: value.decibels,
        humidity: value.humidity,
        temperature: value.temperature,
      };
      if (TYPES.some((t) => t.id === type)) {
        dispatch({ type: "PUSH_POINT", payload: { key: type, point } });
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new-sensor-data", onNewData);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-sensor-data", onNewData);
    };
  }, []);

  // Series por pestaña
  const series = useMemo(() => {
    if (active === "air") {
      return [
        { key: "pm25", label: "PM2.5 (µg/m³)" },
        { key: "pm10", label: "PM10 (µg/m³)" },
        { key: "co2", label: "CO₂ (ppm)" },
      ];
    }
    if (active === "noise") {
      return [{ key: "decibels", label: "dB (decibelios)" }];
    }
    return [
      { key: "humidity", label: "Humedad (%)" },
      { key: "temperature", label: "Temperatura (°C)" },
    ];
  }, [active]);

  const yLabel = useMemo(() => {
    if (active === "air") return "Concentración";
    if (active === "noise") return "dB";
    return "Magnitud";
  }, [active]);

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Dashboard — GAMC</h1>
        <span
          title={connected ? "Conectado en tiempo real" : "Desconectado"}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: connected ? "#16a34a" : "#ef4444",
            display: "inline-block",
          }}
        />
      </header>

      {/* Tabs */}
      <nav style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: active === t.id ? "#111827" : "#ffffff",
              color: active === t.id ? "#ffffff" : "#111827",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <SensorChart data={state[active] || []} series={series} yLabel={yLabel} />
      </section>
    </div>
  );
}
