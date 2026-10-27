import type { ActiveEvent, Difficulty, ReactorState } from "./types";

/** Каталог сценариев нештатных событий. */
export interface EventScenario {
  id: string;
  title: string;
  description: string;
  reactionWindowSec: number;
}

export const EVENT_SCENARIOS: EventScenario[] = [
  {
    id: "pump-failure",
    title: "Отказ насоса охлаждения",
    description:
      "Основной насос охлаждения вышел из строя, эффективность охлаждения падает. Включите резервный насос, пока температура не вышла за норму.",
    reactionWindowSec: 30,
  },
  {
    id: "grid-spike",
    title: "Скачок нагрузки в сети",
    description:
      "Резко вырос спрос на электроэнергию в сети. Скорректируйте распределение выработки, чтобы не допустить дефицита.",
    reactionWindowSec: 25,
  },
  {
    id: "maintenance",
    title: "Плановое техобслуживание блока",
    description:
      "Регламент требует временно ограничить мощность блока. Пока обслуживание не завершится, мощность автоматически ограничена.",
    reactionWindowSec: 35,
  },
  {
    id: "extreme-weather",
    title: "Экстремальная погода",
    description:
      "Резкое похолодание раскачивает потребление электроэнергии в сети. Следите за балансом выработки и спроса.",
    reactionWindowSec: 30,
  },
];

let eventCounter = 0;

/** Запускает новое событие из каталога и добавляет его в state.activeEvents. */
export function spawnEvent(
  state: ReactorState,
  scenarioId: string,
): ReactorState {
  const scenario = EVENT_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return state;

  eventCounter += 1;
  const event: ActiveEvent = {
    id: `${scenario.id}-${eventCounter}`,
    scenarioId: scenario.id,
    title: scenario.title,
    description: scenario.description,
    startedAt: state.timeSec,
    reactionWindowSec: scenario.reactionWindowSec,
    resolved: false,
  };

  return { ...state, activeEvents: [...state.activeEvents, event] };
}

// --- Автогенерация событий (Этап 5) --------------------------------------
//
// Первые calmPeriodSec секунд смены — спокойный, обучающий период без
// событий. Дальше вероятность нового события на каждый тик линейно растёт
// от pStart до pMax на протяжении rampDurationSec и затем держится на
// плато — так события ощутимо учащаются к середине смены. Профиль тайминга
// зависит от выбранной сложности (Этап 10) — и отдельно, всегда одинаковый,
// от демо-режима (Этап 9, для питч-сессии): там события начинаются заметно
// раньше и идут чаще, чтобы за 2.5 минуты гарантированно случилось и
// спокойное начало, и минимум одна нештатная ситуация.

export interface SpawnTiming {
  calmPeriodSec: number;
  rampDurationSec: number;
  pStart: number;
  pMax: number;
  minGapAfterEventSec: number;
}

const EASY_TIMING: SpawnTiming = {
  calmPeriodSec: 210, // 3.5 минуты
  rampDurationSec: 180,
  pStart: 0.015,
  pMax: 0.08,
  minGapAfterEventSec: 15,
};

const NORMAL_TIMING: SpawnTiming = {
  calmPeriodSec: 150, // 2.5 минуты
  rampDurationSec: 150,
  pStart: 0.02,
  pMax: 0.12,
  minGapAfterEventSec: 10,
};

const HARD_TIMING: SpawnTiming = {
  calmPeriodSec: 90, // 1.5 минуты
  rampDurationSec: 120,
  pStart: 0.04,
  pMax: 0.2,
  minGapAfterEventSec: 6,
};

export const DEMO_TIMING: SpawnTiming = {
  calmPeriodSec: 12,
  rampDurationSec: 40,
  pStart: 0.15,
  pMax: 0.35,
  minGapAfterEventSec: 15,
};

export const SPAWN_TIMINGS: Record<Difficulty, SpawnTiming> = {
  easy: EASY_TIMING,
  normal: NORMAL_TIMING,
  hard: HARD_TIMING,
};

/** Профиль тайминга для состояния: демо всегда одинаковое, иначе — по сложности. */
export function timingForState(state: ReactorState): SpawnTiming {
  return state.isDemo ? DEMO_TIMING : SPAWN_TIMINGS[state.difficulty];
}

/** Вероятность спавна нового события на один тик симуляции в момент timeSec. */
export function eventSpawnProbability(
  timeSec: number,
  timing: SpawnTiming = NORMAL_TIMING,
): number {
  if (timeSec < timing.calmPeriodSec) return 0;
  const elapsed = Math.min(timeSec - timing.calmPeriodSec, timing.rampDurationSec);
  return (
    timing.pStart + (timing.pMax - timing.pStart) * (elapsed / timing.rampDurationSec)
  );
}

/**
 * Решает, нужно ли запустить новое случайное событие на этом тике, и если
 * да — какое. Источник случайности передаётся параметром (по умолчанию
 * Math.random), чтобы функция оставалась тестируемой с фиксированным rng.
 * Тайминг берётся из state.isDemo / state.difficulty.
 */
export function maybeAutoSpawnEvent(
  state: ReactorState,
  rng: () => number = Math.random,
): ReactorState {
  if (state.isMeltdown) return state;
  if (state.activeEvents.length > 0) return state; // не наваливаем события друг на друга

  const timing = timingForState(state);

  const lastEventEnd =
    state.eventLog.length > 0
      ? state.eventLog[state.eventLog.length - 1].endedAt
      : -Infinity;
  if (state.timeSec - lastEventEnd < timing.minGapAfterEventSec) return state;

  if (rng() >= eventSpawnProbability(state.timeSec, timing)) return state;

  const scenario =
    EVENT_SCENARIOS[Math.floor(rng() * EVENT_SCENARIOS.length)];
  return spawnEvent(state, scenario.id);
}
