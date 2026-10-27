import { AnimatePresence, motion } from "framer-motion";
import type { AchievementId } from "../../engine/achievements";
import { ACHIEVEMENTS } from "../../data/achievements";

interface AchievementToastStackProps {
  toasts: AchievementId[];
  onDismiss: (id: AchievementId) => void;
}

/** Всплывающие уведомления о только что разблокированных достижениях. */
export function AchievementToastStack({
  toasts,
  onDismiss,
}: AchievementToastStackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((id) => {
          const info = ACHIEVEMENTS[id];
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-amber-400/60 bg-zinc-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <motion.span
                className="text-3xl"
                aria-hidden="true"
                animate={{ rotate: [0, -8, 8, -4, 0] }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                {info.emoji}
              </motion.span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-amber-400 uppercase">
                  Достижение разблокировано
                </p>
                <p className="text-sm font-semibold text-zinc-50">{info.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                  {info.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(id)}
                className="shrink-0 text-zinc-500 transition hover:text-zinc-300"
                aria-label="Скрыть уведомление"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
