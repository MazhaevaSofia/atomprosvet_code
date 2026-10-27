import { AnimatePresence, motion } from "framer-motion";
import type { ActiveEvent } from "../../engine/types";

interface EventToastStackProps {
  toasts: ActiveEvent[];
  onDismiss: (id: string) => void;
}

/** Всплывающие уведомления о только что начавшихся нештатных событиях. */
export function EventToastStack({ toasts, onDismiss }: EventToastStackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-rose-400/60 bg-zinc-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur"
          >
            <span className="text-2xl" aria-hidden="true">
              🚨
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-300">{t.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">
                {t.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 text-zinc-500 transition hover:text-zinc-300"
              aria-label="Скрыть уведомление"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
