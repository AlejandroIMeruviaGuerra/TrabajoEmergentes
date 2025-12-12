    import { useEffect, useState } from "react";
    import { fetchNoiseOverview } from "../../emergentes/services/api";
    import NoiseRadar from "./NoiseGraphics/NoiseRadar";
    import NoisePeakTimeline from "./NoiseGraphics/NoisePeakTimeline";
    import NoiseDensityGrid from "./NoiseGraphics/NoiseDensityGrid";

    import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
    BarChart, Bar, ResponsiveContainer
    } from "recharts";

    export default function NoiseReports() {
    const [data, setData] = useState(null);
    const [days, setDays] = useState(3);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
        setLoading(true);
        const now = new Date();
        const from = new Date();
        from.setDate(now.getDate() - days);

        const params = {
            from: from.toISOString().slice(0, 19).replace("T", " "),
            to: now.toISOString().slice(0, 19).replace("T", " ")
        };

        const r = await fetchNoiseOverview(params);
        setData(r);
        setLoading(false);
        };

        load();
    }, [days]);

    if (loading) return "Cargando...";
    if (!data?.ok) return "Sin datos";

    const evo = data.evolucion.map((x) => ({
        ...x,
        tLabel: new Date(x.t).toLocaleString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit"
        })
    }));

    return (
        <div style={{ maxWidth: 1200, margin: "24px auto" }}>
        <h1>Reportes de Ruido</h1>

        <div style={{ marginBottom: 20 }}>
            <label>Días atrás: </label>
            <select value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={1}>1 día</option>
            <option value={3}>3 días</option>
            <option value={7}>7 días</option>
            </select>
        </div>

        {/* EVOLUCIÓN */}
        <section style={{ background: "#fff", padding: 20, borderRadius: 12 }}>
            <h2>Evolución de Decibeles (LAeq)</h2>

            <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={evo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="laeq" name="LAeq" stroke="#2563eb" dot={false} />
                <Line type="monotone" dataKey="lai" name="LAi" stroke="#dc2626" dot={false} />
                <Line type="monotone" dataKey="laimax" name="LAmax" stroke="#16a34a" dot={false} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </section>

        {/* PROMEDIO POR SENSOR */}
        <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
            <h2>Promedio por Sensor</h2>

            <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data.porSensor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="devEui" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="laeq_mean" name="LAeq Promedio" fill="#2563eb" />
                <Bar dataKey="laimax_mean" name="Laimax Promedio" fill="#dc2626" />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </section>

        {/* HISTOGRAMA */}
        <section style={{ background: "#fff", padding: 20, borderRadius: 12, marginTop: 20 }}>
            <h2>Distribución de Decibeles</h2>

            <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
                <BarChart data={data.histograma}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin_start" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Ventanas" fill="#10b981" />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </section>

{/* NUEVAS GRAFICAS PROFESIONALES */}
      <NoiseRadar porSensor={data.porSensor} />
      <NoisePeakTimeline evolucion={data.evolucion} threshold={70} />
      <NoiseDensityGrid evolucion={data.evolucion} />
        </div>
    );
    }
