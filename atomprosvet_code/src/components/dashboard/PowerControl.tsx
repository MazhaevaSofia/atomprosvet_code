import { SCRAM_SCORE_PENALTY } from "../../engine/reactorEngine";
import { parameterInfo } from "../../data/tooltips";

interface PowerControlProps {
  targetPower: number;
  power: number;
  fuelLevel: number;
  onChange: (power: number) => void;
  onScram: () => void;
}

const FUEL_CRITICAL_THRESHOLD = 20;

export function PowerControl({
  targetPower,
  power,
  fuelLevel,
  onChange,
  onScram,
}: PowerControlProps) {
  const fuelCritical = fuelLevel <= FUEL_CRITICAL_THRESHOLD;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
          Мощность реактора
        </h2>
        <span className="font-mono text-sm text-zinc-300">
          Сейчас {power.toFixed(0)}% → цель {targetPower}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={targetPower}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400"
        aria-label="Целевая мощность реактора, %"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, targetPower - 10))}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-700 active:scale-95"
        >
          −10%
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(100, targetPower + 10))}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-700 active:scale-95"
        >
          +10%
        </button>
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-3">
        <div
          className="mb-1 flex items-center justify-between text-sm text-zinc-300"
          title={parameterInfo("fuel").short}
        >
          <span>Топливо</span>
          <span className={fuelCritical ? "font-semibold text-rose-400" : "font-mono"}>
            {fuelLevel.toFixed(0)}%
            {fuelCritical && " · мощность ограничена"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full transition-all duration-300 ${
              fuelCritical ? "bg-rose-400" : "bg-emerald-400"
            }`}
            style={{ width: `${fuelLevel}%` }}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-3">
        <button
          type="button"
          onClick={onScram}
          title={`Мгновенно сбрасывает мощность до 0%. Стоит −${SCRAM_SCORE_PENALTY} очков.`}
          aria-label="Аварийная защита"
          className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
        >
          🛑 Аварийная защита (АЗ)
        </button>
        <p className="mt-1.5 text-center text-xs leading-relaxed text-zinc-400">
          Мгновенный останов реактора. Стоит −{SCRAM_SCORE_PENALTY} очков —
          использовать только в крайнем случае.
        </p>
      </div>
    </div>
  );
}
