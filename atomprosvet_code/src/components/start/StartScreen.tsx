import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FullscreenButton } from "../common/FullscreenButton";
import { DIFFICULTIES } from "../../data/difficulty";
import type { Difficulty } from "../../engine/types";

interface StartScreenProps {
  /** demo=true запускает короткий (2.5 мин) ускоренный сценарий для питч-сессии
   *  (сложность в демо-режиме игнорируется движком). */
  onStart: (demo: boolean, difficulty: Difficulty) => void;
  onOpenGuide: () => void;
}

const BOOT_MESSAGES = [
  "Инициализация систем пульта…",
  "Проверка датчиков температуры и давления…",
  "Синхронизация с энергосистемой…",
  "Калибровка индикаторов безопасности…",
  "Реактор готов к запуску.",
];

const BOOT_STEP_MS = 480;

const ONBOARDING = [
  {
    emoji: "🧑‍🔧",
    title: "Вы — оператор смены",
    text: "Управляете упрощённой моделью энергоблока: мощность, температура, давление, безопасность.",
  },
  {
    emoji: "🎛️",
    title: "Следите и реагируйте",
    text: "Держите параметры в норме, распределяйте энергию и вовремя реагируйте на нештатные ситуации.",
  },
  {
    emoji: "💡",
    title: "Нужна подсказка?",
    text: "Кнопки «Справка» и «Факты» на пульте — там простое объяснение каждого показателя и станции в целом.",
  },
];

/** Анимированный стартовый экран: запуск станции, затем краткий онбординг. */
export function StartScreen({ onStart, onOpenGuide }: StartScreenProps) {
  const [bootStep, setBootStep] = useState(0);
  const [booted, setBooted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  useEffect(() => {
    if (bootStep >= BOOT_MESSAGES.length - 1) {
      const doneTimer = window.setTimeout(() => setBooted(true), BOOT_STEP_MS);
      return () => window.clearTimeout(doneTimer);
    }
    const timer = window.setTimeout(
      () => setBootStep((s) => s + 1),
      BOOT_STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [bootStep]);

  const progress = ((bootStep + 1) / BOOT_MESSAGES.length) * 100;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <FullscreenButton className="absolute top-4 right-4" />

      <ReactorCoreIcon />

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-6 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
      >
        АтомПросвет
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-2 text-sm text-zinc-500 sm:text-base"
      >
        Тренажёр-симулятор пульта управления атомной станцией
      </motion.p>

      <div className="mt-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!booted ? (
            <motion.div
              key="boot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-cyan-400"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: BOOT_STEP_MS / 1000, ease: "easeInOut" }}
                />
              </div>
              <p className="mt-3 text-center font-mono text-xs text-zinc-500">
                {BOOT_MESSAGES[bootStep]}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3"
            >
              {ONBOARDING.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.35 }}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left"
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}

              <motion.button
                type="button"
                onClick={onOpenGuide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + ONBOARDING.length * 0.1, duration: 0.35 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
              >
                📖 Как играть — подробный гайд
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 + (ONBOARDING.length + 1) * 0.1,
                  duration: 0.35,
                }}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
              >
                <p className="mb-2 text-center text-[11px] tracking-wide text-zinc-500 uppercase">
                  Сложность
                </p>
                <div className="flex gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      title={d.description}
                      aria-label={d.label}
                      aria-pressed={difficulty === d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                        difficulty === d.id
                          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-600">
                  {DIFFICULTIES.find((d) => d.id === difficulty)?.description}
                </p>
              </motion.div>

              <motion.button
                type="button"
                onClick={() => onStart(false, difficulty)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 + (ONBOARDING.length + 2) * 0.1,
                  duration: 0.35,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-1 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                Начать смену
              </motion.button>

              <motion.button
                type="button"
                onClick={() => onStart(true, difficulty)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 + (ONBOARDING.length + 3) * 0.1,
                  duration: 0.35,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300"
              >
                🎤 Демо-сценарий (≈2.5 мин, для питч-сессии)
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Пульсирующая иконка реакторной активной зоны. */
function ReactorCoreIcon() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
      />
      <motion.div
        className="absolute inset-3 rounded-full border-2 border-cyan-400/50"
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ borderBottomColor: "transparent", borderLeftColor: "transparent" }}
      />
      <motion.div
        className="h-8 w-8 rounded-full bg-cyan-400"
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "0 0 24px 4px rgba(34,211,238,0.55)" }}
      />
    </div>
  );
}
