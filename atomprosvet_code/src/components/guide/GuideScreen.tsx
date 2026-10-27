import { GUIDE_SECTIONS } from "../../data/guide";
import { ACHIEVEMENT_LIST } from "../../data/achievements";

interface GuideScreenProps {
  onClose: () => void;
  /** Текст кнопки внизу — разный в зависимости от того, откуда открыт гайд. */
  closeLabel?: string;
}

/**
 * Полноценный гайд «Как играть» — рассчитан на то, что человек прочитает его
 * один раз перед первой сменой и дальше проходит тренажёр самостоятельно.
 * Открывается со стартового экрана (перед игрой) и с пульта (как справочник).
 */
export function GuideScreen({
  onClose,
  closeLabel = "Закрыть",
}: GuideScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl p-4 lg:p-6">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-zinc-50">Как играть</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Прочитайте один раз — дальше сможете проходить тренажёр
            самостоятельно, без подсказок.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {GUIDE_SECTIONS.map((section, i) => (
            <article
              key={section.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20 sm:p-5"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs text-zinc-500"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-xl" aria-hidden="true">
                  {section.emoji}
                </span>
                <h2 className="text-sm font-semibold text-cyan-300">
                  {section.title}
                </h2>
              </div>

              {section.intro && (
                <p className="text-sm leading-relaxed text-zinc-300">
                  {section.intro}
                </p>
              )}

              {section.bullets && (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {section.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-2 text-sm leading-relaxed text-zinc-300"
                    >
                      <span className="text-zinc-600" aria-hidden="true">
                        •
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.id === "scoring" && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ACHIEVEMENT_LIST.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5"
                    >
                      <span className="text-lg" aria-hidden="true">
                        {a.emoji}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-amber-300">
                          {a.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                          {a.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 active:scale-[0.99]"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
