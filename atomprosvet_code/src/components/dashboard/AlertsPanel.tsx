import type { ActiveEvent } from "../../engine/types";
import { eventActionLabel } from "../../data/eventActions";

interface AlertsPanelProps {
  activeEvents: ActiveEvent[];
  timeSec: number;
  onResolve: (eventId: string) => void;
}

export function AlertsPanel({ activeEvents, timeSec, onResolve }: AlertsPanelProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-300 uppercase">
        Тревоги
      </h2>

      {activeEvents.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Сейчас всё спокойно. Если что-то случится, здесь появится карточка с
          таймером и кнопкой действия.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activeEvents.map((e) => {
            const elapsed = timeSec - e.startedAt;
            const remaining = Math.max(0, e.reactionWindowSec - elapsed);
            const share = Math.min(100, (remaining / e.reactionWindowSec) * 100);
            return (
              <li
                key={e.id}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-amber-300">
                    ⚠ {e.title}
                  </span>
                  <span className="shrink-0 font-mono text-sm text-amber-300">
                    {remaining} с
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"
                  role="progressbar"
                  aria-label="Оставшееся время на реакцию"
                  aria-valuemin={0}
                  aria-valuemax={e.reactionWindowSec}
                  aria-valuenow={remaining}
                >
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <p className="mt-2 text-sm leading-snug text-zinc-300">
                  {e.description}
                </p>
                <button
                  type="button"
                  onClick={() => onResolve(e.id)}
                  className="mt-3 w-full rounded-lg border border-amber-400/50 bg-amber-400/20 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/30 active:scale-95"
                >
                  {eventActionLabel(e.scenarioId)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
