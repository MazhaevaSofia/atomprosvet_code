import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistorySample } from "../../store/useGameStore";

interface HistoryChartProps {
  history: HistorySample[];
}

/** Давление в МПа в разы меньше температуры, поэтому на графике оно ×10. */
const PRESSURE_SERIES_NAME = "Давление (×10)";

const SERIES: { key: keyof HistorySample; color: string; name: string }[] = [
  { key: "temperature", color: "#fb7185", name: "Температура" },
  { key: "pressure", color: "#38bdf8", name: PRESSURE_SERIES_NAME },
  { key: "safety", color: "#4ade80", name: "Безопасность" },
  { key: "power", color: "#fbbf24", name: "Мощность" },
];

export function HistoryChart({ history }: HistoryChartProps) {
  // Давление визуально мельче остальных величин — масштабируем для читаемости графика,
  // подпись серии честно отражает масштаб.
  const data = history.map((s) => ({ ...s, pressure: s.pressure * 10 }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
          История показателей (последние 60 с)
        </h2>
        <div className="flex gap-3">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1 text-xs text-zinc-300">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="timeSec"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              stroke="#3f3f46"
            />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} stroke="#3f3f46" />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(t) => `Секунда смены: ${t}`}
              formatter={(value, name) => {
                const n = Number(value);
                return name === PRESSURE_SERIES_NAME
                  ? [`${(n / 10).toFixed(1)} МПа`, "Давление"]
                  : [Math.round(n), name];
              }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
