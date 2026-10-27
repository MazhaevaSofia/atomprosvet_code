import type { ReactorState } from "./types";

/** Идентификаторы достижений — ключи каталога текстов в data/achievements.ts. */
export type AchievementId =
  | "first-response"
  | "quick-reflex"
  | "saved-from-overheat"
  | "energy-efficient"
  | "perfect-shift"
  | "no-missed"
  | "fuel-thrifty";

const QUICK_REFLEX_SEC = 5;
const BALANCE_STREAK_THRESHOLD_SEC = 20;
const PERFECT_SHIFT_MIN_SAFETY = 70;
/** Финишировать смену, сохранив хотя бы столько топлива — требует не
 *  держать мощность на максимуме бездумно всю смену. */
const FUEL_THRIFTY_MIN_FUEL = 60;

/**
 * Достижения, доступные по ходу смены — проверяются каждый тик.
 * Функция не хранит состояние: возвращает все id, условиям которых
 * состояние удовлетворяет ПРЯМО СЕЙЧАС; какие из них новые — решает вызывающий
 * код, сравнивая с уже разблокированными (повторный вызов безопасен).
 */
export function evaluateLiveAchievements(state: ReactorState): AchievementId[] {
  const unlocked: AchievementId[] = [];
  const handled = state.eventLog.filter((e) => e.outcome === "handled");

  if (handled.length > 0) unlocked.push("first-response");
  if (handled.some((e) => e.reactionSec <= QUICK_REFLEX_SEC)) {
    unlocked.push("quick-reflex");
  }
  if (handled.some((e) => e.scenarioId === "pump-failure")) {
    unlocked.push("saved-from-overheat");
  }
  if (state.balanceStreakSec >= BALANCE_STREAK_THRESHOLD_SEC) {
    unlocked.push("energy-efficient");
  }

  return unlocked;
}

/** Достижения, которые подводятся только по итогам всей смены. */
export function evaluateEndOfShiftAchievements(
  state: ReactorState,
): AchievementId[] {
  const unlocked: AchievementId[] = [];

  if (state.minSafetySoFar >= PERFECT_SHIFT_MIN_SAFETY) {
    unlocked.push("perfect-shift");
  }

  const missed = state.eventLog.filter((e) => e.outcome === "missed").length;
  if (state.eventLog.length > 0 && missed === 0) {
    unlocked.push("no-missed");
  }

  if (state.fuelLevel >= FUEL_THRIFTY_MIN_FUEL) {
    unlocked.push("fuel-thrifty");
  }

  return unlocked;
}
