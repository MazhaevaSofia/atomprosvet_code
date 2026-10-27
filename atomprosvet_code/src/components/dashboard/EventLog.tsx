import type { EventLogEntry } from "../../engine/types";

interface EventLogProps {
  entries: EventLogEntry[];
}

export function EventLog({ entries }: EventLogProps) {
  const recent = [...entries].reverse();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-300 uppercase">
        Журнал событий
      </h2>

      {recent.length === 0 ? (
        <p className="text-sm text-zinc-400">Пока пусто.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {recent.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-400">{e.title}</span>
              <span
                className={
                  e.outcome === "handled"
                    ? "font-medium text-emerald-400"
                    : "font-medium text-rose-400"
                }
              >
                {e.outcome === "handled" ? "справился" : "не справился"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
