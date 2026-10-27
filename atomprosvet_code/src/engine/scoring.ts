import type { ReactorState } from "./types";
import type { AchievementId } from "./achievements";

export type Rank = "Стажёр" | "Оператор" | "Главный инженер смены";

/**
 * Пороговые значения очков для звания по итогам смены. Подобраны так, что
 * ровный, но пассивный (без единого нештатного события) идеальный прогон
 * приносит около 300 очков только за поддержание безопасности — этого
 * достаточно на «Оператора», а «Главный инженер смены» требует ещё и
 * реально отработанных нештатных ситуаций.
 */
const RANK_THRESHOLDS: { rank: Rank; minScore: number }[] = [
  { rank: "Главный инженер смены", minScore: 320 },
  { rank: "Оператор", minScore: 150 },
  { rank: "Стажёр", minScore: -Infinity },
];

export function rankForScore(score: number): Rank {
  const found = RANK_THRESHOLDS.find((t) => score >= t.minScore);
  return found?.rank ?? "Стажёр";
}

export interface ShiftSummary {
  score: number;
  rank: Rank;
  durationSec: number;
  eventsHandled: number;
  eventsMissed: number;
  minSafety: number;
  finalEnergyOutput: number;
  unlockedAchievementIds: AchievementId[];
  failedByMeltdown: boolean;
}

export function buildShiftSummary(
  state: ReactorState,
  unlockedAchievementIds: AchievementId[],
): ShiftSummary {
  const eventsHandled = state.eventLog.filter(
    (e) => e.outcome === "handled",
  ).length;
  const eventsMissed = state.eventLog.filter(
    (e) => e.outcome === "missed",
  ).length;

  return {
    score: state.score,
    rank: rankForScore(state.score),
    durationSec: state.timeSec,
    eventsHandled,
    eventsMissed,
    minSafety: state.minSafetySoFar,
    finalEnergyOutput: state.energyOutput,
    unlockedAchievementIds,
    failedByMeltdown: state.isMeltdown,
  };
}
