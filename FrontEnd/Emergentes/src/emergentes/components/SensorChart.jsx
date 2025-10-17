import { useMemo } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

/**
 * props:
 *  data: array de puntos { t, ...series }
 *  series: [{ key: 'pm25', label: 'PM2.5' }, ...]
 *  yLabel: string
 */
export default function SensorChart({ data = [], series = [], yLabel = "" }) {
  const cleaned = useMemo(() => data.slice(-50), [data]); // últimos 50

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cleaned} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={formatTime} />
          <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
          <Tooltip labelFormatter={(v) => formatTime(v)} />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
