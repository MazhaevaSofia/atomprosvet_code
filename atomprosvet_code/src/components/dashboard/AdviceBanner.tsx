import type { Advice, AdviceLevel } from "../../engine/advice";

interface AdviceBannerProps {
  advice: Advice;
}

/** Цвета и значок для каждого уровня: значок дублирует цвет для дальтоников. */
const LEVEL_STYLE: Record<
  AdviceLevel,
  { icon: string; label: string; box: string; badge: string }
> = {
  ok: {
    icon: "✓",
    label: "Спокойно",
    box: "border-emerald-500/30 bg-emerald-500/10",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  info: {
    icon: "i",
    label: "Подсказка",
    box: "border-sky-500/30 bg-sky-500/10",
    badge: "bg-sky-500/20 text-sky-300",
  },
  warning: {
    icon: "!",
    label: "Внимание",
    box: "border-amber-500/40 bg-amber-500/10",
    badge: "bg-amber-500/20 text-amber-300",
  },
  danger: {
    icon: "✕",
    label: "Опасно",
    box: "border-rose-500/50 bg-rose-500/10",
    badge: "bg-rose-500/20 text-rose-300",
  },
};

/** Одна главная подсказка: что сейчас происходит и что делать. */
export function AdviceBanner({ advice }: AdviceBannerProps) {
  const style = LEVEL_STYLE[advice.level];

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-black/20 transition-colors duration-300 ${style.box}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.badge}`}
      >
        {style.icon}
      </span>
      <p className="text-base leading-snug text-zinc-100">
        <span className="font-semibold">{style.label}. </span>
        {advice.text}
      </p>
    </div>
  );
}
