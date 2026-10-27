import { FACTS } from "../../data/facts";

interface FactsScreenProps {
  onBack: () => void;
}

export function FactsScreen({ onBack }: FactsScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl p-4 lg:p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-50">
              Факты об атомной энергетике
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Коротко о том, как устроена и как работает атомная станция.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            ← Назад к пульту
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FACTS.map((fact) => (
            <article
              key={fact.id}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700"
            >
              <span className="text-3xl" aria-hidden="true">
                {fact.emoji}
              </span>
              <h2 className="text-sm font-semibold text-cyan-300">{fact.title}</h2>
              <p className="text-sm leading-relaxed text-zinc-300">{fact.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
