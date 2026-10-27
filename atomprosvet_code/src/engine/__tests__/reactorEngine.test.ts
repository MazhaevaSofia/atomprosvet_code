import { describe, expect, it } from "vitest";
import {
  DEMO_SHIFT_DURATION_SEC,
  FUEL_CONSUMPTION_RATE_PER_SEC,
  FUEL_CRITICAL_THRESHOLD,
  SCRAM_SCORE_PENALTY,
  SHIFT_DURATION_SEC,
  createInitialState,
  tick,
} from "../reactorEngine";
import { spawnEvent } from "../events";

describe("reactorEngine.tick", () => {
  it("является детерминированной функцией: одинаковый вход -> одинаковый выход", () => {
    const state = createInitialState();
    const a = tick(state, { setTargetPower: 80 });
    const b = tick(state, { setTargetPower: 80 });
    expect(a).toEqual(b);
  });

  it("не даёт мощности измениться мгновенно (ограничение скорости)", () => {
    const state = createInitialState();
    const next = tick(state, { setTargetPower: 100 });
    expect(next.power).toBeGreaterThan(state.power);
    expect(next.power - state.power).toBeLessThanOrEqual(3);
  });

  it("плавно приближает мощность к целевой на нескольких тиках", () => {
    let state = createInitialState();
    for (let i = 0; i < 50; i++) {
      state = tick(state, { setTargetPower: 90 });
    }
    expect(state.power).toBeCloseTo(90, 0);
  });

  it("повышает равновесную температуру при росте мощности", () => {
    let low = createInitialState();
    let high = createInitialState();
    for (let i = 0; i < 30; i++) {
      low = tick(low, { setTargetPower: 20 });
      high = tick(high, { setTargetPower: 95 });
    }
    expect(high.temperature).toBeGreaterThan(low.temperature);
  });

  it("снижает уровень безопасности, когда температура уходит в опасную зону", () => {
    let state = createInitialState();
    for (let i = 0; i < 80; i++) {
      state = tick(state, { setTargetPower: 100 });
    }
    expect(state.temperature).toBeGreaterThan(350);
    expect(state.safety).toBeLessThan(100);
  });

  it("объявляет аварию (isMeltdown), когда безопасность падает до нуля", () => {
    let state = createInitialState();
    state = { ...state, safety: 3, temperature: 460 };
    const next = tick(state, {});
    expect(next.isMeltdown).toBe(true);
  });

  it("не меняет состояние дальше после аварии", () => {
    let state = createInitialState();
    state = { ...state, isMeltdown: true, timeSec: 10 };
    const next = tick(state, { setTargetPower: 100 });
    expect(next).toEqual(state);
  });

  it("сумма city/industry share всегда равна 100", () => {
    let state = createInitialState();
    state = tick(state, { setCityShare: 30 });
    expect(state.cityShare + state.industryShare).toBe(100);
  });

  it("активное событие pump-failure подавляет coolantFlow, пока не решено", () => {
    let state = createInitialState();
    state = spawnEvent(state, "pump-failure");
    expect(state.activeEvents).toHaveLength(1);

    const before = state.coolantFlow;
    state = tick(state, {});
    expect(state.coolantFlow).toBeLessThan(before);
  });

  it("резолв события переносит его в журнал со статусом handled", () => {
    let state = createInitialState();
    state = spawnEvent(state, "pump-failure");
    const eventId = state.activeEvents[0].id;

    state = tick(state, { resolveEventIds: [eventId] });

    expect(state.activeEvents).toHaveLength(0);
    expect(state.eventLog).toHaveLength(1);
    expect(state.eventLog[0].outcome).toBe("handled");
  });

  it("истёкшее по таймеру событие переносится в журнал со статусом missed", () => {
    let state = createInitialState();
    state = spawnEvent(state, "grid-spike"); // reactionWindowSec = 25

    for (let i = 0; i < 26; i++) {
      state = tick(state, {});
    }

    expect(state.activeEvents).toHaveLength(0);
    expect(state.eventLog.some((e) => e.outcome === "missed")).toBe(true);
  });

  it("grid-spike повышает спрос сети, пока событие активно", () => {
    const withoutEvent = tick(createInitialState(), {});

    let withEvent = createInitialState();
    withEvent = spawnEvent(withEvent, "grid-spike");
    withEvent = tick(withEvent, {});

    expect(withEvent.gridDemand).toBeGreaterThan(withoutEvent.gridDemand + 200);
  });

  it("maintenance принудительно ограничивает мощность, даже если пользователь просит максимум", () => {
    let state = createInitialState();
    state = spawnEvent(state, "maintenance"); // reactionWindowSec = 35

    // остаёмся внутри окна действия события, пока оно не истекло само по себе
    for (let i = 0; i < 30; i++) {
      state = tick(state, { setTargetPower: 100 });
    }

    // мощность не может выйти выше ограничения ТО, хотя пользователь просил 100%
    expect(state.power).toBeLessThanOrEqual(40);
    // но намерение пользователя (targetPower) сохраняется для UI
    expect(state.targetPower).toBe(100);
  });

  it("после окончания maintenance мощность возвращается к запрошенной пользователем", () => {
    let state = createInitialState();
    state = spawnEvent(state, "maintenance");
    const eventId = state.activeEvents[0].id;

    for (let i = 0; i < 5; i++) {
      state = tick(state, { setTargetPower: 100 });
    }
    expect(state.power).toBeLessThanOrEqual(40);

    state = tick(state, { resolveEventIds: [eventId] });
    for (let i = 0; i < 40; i++) {
      state = tick(state, {});
    }
    expect(state.power).toBeCloseTo(100, 0);
  });

  it("extreme-weather усиливает раскачку спроса сети относительно спокойного режима", () => {
    let calm = createInitialState();
    let stormy = createInitialState();
    stormy = spawnEvent(stormy, "extreme-weather");

    let maxCalmDelta = 0;
    let maxStormyDelta = 0;
    for (let i = 0; i < 20; i++) {
      const prevCalm = calm.gridDemand;
      const prevStormy = stormy.gridDemand;
      calm = tick(calm, {});
      stormy = tick(stormy, {});
      maxCalmDelta = Math.max(maxCalmDelta, Math.abs(calm.gridDemand - prevCalm));
      maxStormyDelta = Math.max(
        maxStormyDelta,
        Math.abs(stormy.gridDemand - prevStormy),
      );
    }

    expect(maxStormyDelta).toBeGreaterThan(maxCalmDelta);
  });

  it("завершает смену штатно по истечении SHIFT_DURATION_SEC", () => {
    let state = { ...createInitialState(), timeSec: SHIFT_DURATION_SEC - 1 };
    state = tick(state, {});
    expect(state.isShiftComplete).toBe(true);
  });

  it("не меняет состояние дальше после штатного завершения смены", () => {
    const state = { ...createInitialState(), isShiftComplete: true, timeSec: 300 };
    const next = tick(state, { setTargetPower: 100 });
    expect(next).toEqual(state);
  });

  it("отслеживает минимальный уровень безопасности за смену", () => {
    let state = createInitialState();
    for (let i = 0; i < 80; i++) {
      state = tick(state, { setTargetPower: 100 });
    }
    expect(state.minSafetySoFar).toBeLessThan(100);
    expect(state.minSafetySoFar).toBeLessThanOrEqual(state.safety);
  });

  it("демо-режим (Этап 9) даёт более короткую смену", () => {
    const demo = createInitialState({ demo: true });
    expect(demo.isDemo).toBe(true);
    expect(demo.shiftDurationSec).toBe(DEMO_SHIFT_DURATION_SEC);
    expect(demo.shiftDurationSec).toBeLessThan(SHIFT_DURATION_SEC);
  });

  it("завершает демо-смену по истечении DEMO_SHIFT_DURATION_SEC, а не обычной длительности", () => {
    let state = {
      ...createInitialState({ demo: true }),
      timeSec: DEMO_SHIFT_DURATION_SEC - 1,
    };
    state = tick(state, {});
    expect(state.isShiftComplete).toBe(true);
  });

  it("расходует топливо пропорционально мощности", () => {
    let low = createInitialState();
    let high = createInitialState();
    for (let i = 0; i < 30; i++) {
      low = tick(low, { setTargetPower: 20 });
      high = tick(high, { setTargetPower: 100 });
    }
    expect(high.fuelLevel).toBeLessThan(low.fuelLevel);
    expect(low.fuelLevel).toBeLessThan(100);
  });

  it("баланс расхода топлива: критический порог теоретически достижим в пределах обычной смены", () => {
    // Регрессия на баланс расхода: считаем время до критического порога
    // напрямую по экспортированным константам, а не через полный прогон
    // tick() — на 100% мощности реактор обычно раньше уйдёт в аварию из-за
    // безопасности (см. комментарий у FUEL_CONSUMPTION_RATE_PER_SEC), так что
    // полный прогон смены тестировал бы не расход топлива, а гонку с аварией.
    const secondsToCritical =
      (100 - FUEL_CRITICAL_THRESHOLD) / FUEL_CONSUMPTION_RATE_PER_SEC;
    expect(secondsToCritical).toBeLessThanOrEqual(SHIFT_DURATION_SEC);
  });

  it("ограничивает мощность при критически низком запасе топлива", () => {
    let state = { ...createInitialState(), fuelLevel: 15 };
    for (let i = 0; i < 40; i++) {
      state = tick(state, { setTargetPower: 100 });
    }
    expect(state.power).toBeLessThanOrEqual(50);
    // намерение пользователя (targetPower) сохраняется для UI
    expect(state.targetPower).toBe(100);
  });

  it("не расходует топливо, пока мощность на нуле", () => {
    let state = { ...createInitialState(), power: 0, targetPower: 0 };
    state = tick(state, {});
    expect(state.fuelLevel).toBe(100);
  });

  describe("ручная аварийная защита (АЗ)", () => {
    it("мгновенно роняет мощность и цель до нуля, минуя MAX_POWER_RATE", () => {
      const state = { ...createInitialState(), power: 80, targetPower: 80 };
      const next = tick(state, { triggerScram: true });
      expect(next.power).toBe(0);
      expect(next.targetPower).toBe(0);
    });

    it("штрафует очки на SCRAM_SCORE_PENALTY", () => {
      const state = createInitialState();
      const withoutScram = tick(state, {});
      const withScram = tick(state, { triggerScram: true });
      expect(withScram.score).toBe(withoutScram.score - SCRAM_SCORE_PENALTY);
    });

    it("новая цель мощности после АЗ снова растёт плавно, а не мгновенно", () => {
      let state = createInitialState();
      state = tick(state, { triggerScram: true });
      expect(state.power).toBe(0);

      state = tick(state, { setTargetPower: 100 });
      expect(state.power).toBeGreaterThan(0);
      expect(state.power).toBeLessThanOrEqual(3);
    });
  });
});
