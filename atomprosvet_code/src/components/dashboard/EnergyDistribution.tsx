interface EnergyDistributionProps {
  energyOutput: number;
  gridDemand: number;
  cityShare: number;
  industryShare: number;
  onCityShareChange: (share: number) => void;
}

export function EnergyDistribution({
  energyOutput,
  gridDemand,
  cityShare,
  industryShare,
  onCityShareChange,
}: EnergyDistributionProps) {
  const balance = energyOutput - gridDemand;
  const balanceLabel =
    balance >= 0
      ? `+${balance.toFixed(0)} МВт (профицит)`
      : `${balance.toFixed(0)} МВт (дефицит)`;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-300 uppercase">
        Выработка и распределение
      </h2>

      <div className="mb-3 flex items-baseline justify-between font-mono">
        <span className="text-2xl font-semibold text-zinc-50">
          {energyOutput.toFixed(0)} МВт
        </span>
        <span
          className={
            balance >= 0
              ? "text-sm text-emerald-400"
              : "text-sm text-rose-400"
          }
        >
          {balanceLabel}
        </span>
      </div>

      <div className="mb-1 flex justify-between text-sm text-zinc-400">
        <span>Город {cityShare}%</span>
        <span>Промышленность {industryShare}%</span>
      </div>
      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-sky-400 transition-all duration-300"
          style={{ width: `${cityShare}%` }}
        />
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${industryShare}%` }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={cityShare}
        onChange={(e) => onCityShareChange(Number(e.target.value))}
        className="w-full accent-sky-400"
        aria-label="Доля выработки, направляемая в город, %"
      />

      <p className="mt-3 text-sm text-zinc-400">
        Спрос сети: <span className="font-mono text-zinc-300">{gridDemand.toFixed(0)} МВт</span>
      </p>
    </div>
  );
}
