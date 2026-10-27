import { describe, expect, it } from "vitest";
import { createInitialState } from "../reactorEngine";
import {
  evaluateEndOfShiftAchievements,
  evaluateLiveAchievements,
} from "../achievements";
import { rankForScore } from "../scoring";
import type { EventLogEntry } from "../types";

function handledEntry(overrides: Partial<EventLogEntry> = {}): EventLogEntry {
  return {
    id: "e1",
    scenarioId: "grid-spike",
    title: "Скачок нагрузки в сети",
    endedAt: 10,
    reactionSec: 12,
    outcome: "handled",
    ...overrides,
  };
}

describe("evaluateLiveAchievements", () => {
  it("ничего не даёт на старте смены", () => {
    expect(evaluateLiveAchievements(createInitialState())).toEqual([]);
  });

  it("first-response — за любое решённое событие", () => {
    const state = { ...createInitialState(), eventLog: [handledEntry()] };
    expect(evaluateLiveAchievements(state)).toContain("first-response");
  });

  it("quick-reflex — реакция за 5 секунд или быстрее", () => {
    const slow = {
      ...createInitialState(),
      eventLog: [handledEntry({ reactionSec: 20 })],
    };
    const fast = {
      ...createInitialState(),
      eventLog: [handledEntry({ reactionSec: 4 })],
    };
    expect(evaluateLiveAchievements(slow)).not.toContain("quick-reflex");
    expect(evaluateLiveAchievements(fast)).toContain("quick-reflex");
  });

  it("saved-from-overheat — решённый именно pump-failure", () => {
    const other = {
      ...createInitialState(),
      eventLog: [handledEntry({ scenarioId: "grid-spike" })],
    };
    const pump = {
      ...createInitialState(),
      eventLog: [handledEntry({ scenarioId: "pump-failure" })],
    };
    expect(evaluateLiveAchievements(other)).not.toContain("saved-from-overheat");
    expect(evaluateLiveAchievements(pump)).toContain("saved-from-overheat");
  });

  it("energy-efficient — баланс в допуске 20 секунд подряд", () => {
    const short = { ...createInitialState(), balanceStreakSec: 19 };
    const long = { ...createInitialState(), balanceStreakSec: 20 };
    expect(evaluateLiveAchievements(short)).not.toContain("energy-efficient");
    expect(evaluateLiveAchievements(long)).toContain("energy-efficient");
  });
});

describe("evaluateEndOfShiftAchievements", () => {
  it("perfect-shift — безопасность ни разу не падала ниже 70%", () => {
    const solid = { ...createInitialState(), minSafetySoFar: 85 };
    const shaky = { ...createInitialState(), minSafetySoFar: 50 };
    expect(evaluateEndOfShiftAchievements(solid)).toContain("perfect-shift");
    expect(evaluateEndOfShiftAchievements(shaky)).not.toContain("perfect-shift");
  });

  it("no-missed — были события и ни одно не пропущено", () => {
    const clean = { ...createInitialState(), eventLog: [handledEntry()] };
    const missedOne = {
      ...createInitialState(),
      eventLog: [handledEntry({ outcome: "missed" })],
    };
    const noEvents = createInitialState();

    expect(evaluateEndOfShiftAchievements(clean)).toContain("no-missed");
    expect(evaluateEndOfShiftAchievements(missedOne)).not.toContain("no-missed");
    expect(evaluateEndOfShiftAchievements(noEvents)).not.toContain("no-missed");
  });

  it("fuel-thrifty — осталось не меньше 60% топлива к концу смены", () => {
    const thrifty = { ...createInitialState(), fuelLevel: 65 };
    const wasteful = { ...createInitialState(), fuelLevel: 40 };
    expect(evaluateEndOfShiftAchievements(thrifty)).toContain("fuel-thrifty");
    expect(evaluateEndOfShiftAchievements(wasteful)).not.toContain("fuel-thrifty");
  });
});

describe("rankForScore", () => {
  it("возвращает звания по возрастающим порогам", () => {
    expect(rankForScore(0)).toBe("Стажёр");
    expect(rankForScore(149)).toBe("Стажёр");
    expect(rankForScore(150)).toBe("Оператор");
    expect(rankForScore(319)).toBe("Оператор");
    expect(rankForScore(320)).toBe("Главный инженер смены");
  });
});
