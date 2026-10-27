import { PARAMETER_INFO } from "../../data/tooltips";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Выезжающая справа панель «Справка»: объясняет простым языком, за что
 * отвечает каждый параметр симуляции и почему он важен для реальной АЭС.
 */
export function HelpPanel({ open, onClose }: HelpPanelProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm transform overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-5 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-50">Справка</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-sm text-zinc-300 transition hover:bg-zinc-700"
            aria-label="Закрыть справку"
          >
            ✕
          </button>
        </div>

        <p className="mb-5 text-sm text-zinc-400">
          Что означает каждый показатель на пульте управления и почему он
          важен для настоящей атомной станции.
        </p>

        <dl className="flex flex-col gap-4">
          {PARAMETER_INFO.map((p) => (
            <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <dt className="mb-1.5 text-sm font-semibold text-cyan-300">{p.title}</dt>
              <dd className="text-sm leading-relaxed text-zinc-300">{p.long}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </>
  );
}
