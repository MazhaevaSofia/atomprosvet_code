import { describe, expect, it } from "vitest";
import { createInitialState } from "../reactorEngine";
import {
  DEMO_TIMING,
  SPAWN_TIMINGS,
  eventSpawnProbability,
  maybeAutoSpawnEvent,
  timingForState,
} from "../events";

describe("eventSpawnProbability", () => {
  it("равна нулю в первые 2.5 минуты смены (спокойный период)", () => {
    expect(eventSpawnProbability(0)).toBe(0);
    expect(eventSpawnProbability(149)).toBe(0);
  });

  it("растёт после спокойного периода и выходит на плато", () => {
    const atCalmEnd = eventSpawnProbability(150);
    const midRamp = eventSpawnProbability(225);
    const afterRamp = eventSpawnProbability(400);

    expect(atCalmEnd).toBeGreaterThan(0);
    expect(midRamp).toBeGreaterThan(atCalmEnd);
    expect(afterRamp).toBeGreaterThanOrEqual(midRamp);
    // после рампы вероятность больше не растёт (плато)
    expect(eventSpawnProbability(500)).toBe(afterRamp);
  });
});

describe("maybeAutoSpawnEvent", () => {
  it("не запускает событие в спокойный период, даже при rng=0", () => {
    const state = { ...createInitialState(), timeSec: 100 };
    const next = maybeAutoSpawnEvent(state, () => 0);
    expect(next.activeEvents).toHaveLength(0);
  });

  it("запускает событие после спокойного периода, если rng ниже порога вероятности", () => {
    const state = { ...createInitialState(), timeSec: 200 };
    const next = maybeAutoSpawnEvent(state, () => 0);
    expect(next.activeEvents).toHaveLength(1);
  });

  it("не запускает событие, если rng выше вероятности", () => {
    const state = { ...createInitialState(), timeSec: 200 };
    const next = maybeAutoSpawnEvent(state, () => 0.99);
    expect(next.activeEvents).toHaveLength(0);
  });

  it("не запускает новое событие, если уже есть активное", () => {
    const state = {
      ...createInitialState(),
      timeSec: 200,
      activeEvents: [
        {
          id: "grid-spike-1",
          scenarioId: "grid-spike",
          title: "Скачок нагрузки в сети",
          description: "...",
          startedAt: 190,
          reactionWindowSec: 25,
          resolved: false,
        },
      ],
    };
    const next = maybeAutoSpawnEvent(state, () => 0);
    expect(next.activeEvents).toHaveLength(1);
  });

  it("не запускает событие вскоре после завершения предыдущего (антиспам)", () => {
    const state = {
      ...createInitialState(),
      timeSec: 205,
      eventLog: [
        {
          id: "pump-failure-1",
          scenarioId: "pump-failure",
          title: "Отказ насоса охлаждения",
          endedAt: 200,
          reactionSec: 12,
          outcome: "handled" as const,
        },
      ],
    };
    const next = maybeAutoSpawnEvent(state, () => 0);
    expect(next.activeEvents).toHaveLength(0);
  });

  it("не делает ничего после аварии", () => {
    const state = { ...createInitialState(), timeSec: 200, isMeltdown: true };
    const next = maybeAutoSpawnEvent(state, () => 0);
    expect(next).toEqual(state);
  });

  it("в демо-режиме спокойный период короче и события начинаются раньше", () => {
    const normal = { ...createInitialState(), timeSec: 20 };
    const demo = { ...createInitialState({ demo: true }), timeSec: 20 };

    expect(maybeAutoSpawnEvent(normal, () => 0).activeEvents).toHaveLength(0);
    expect(maybeAutoSpawnEvent(demo, () => 0).activeEvents).toHaveLength(1);
  });
});

describe("eventSpawnProbability (демо-режим)", () => {
  it("спокойный период короче, а вероятность на плато выше", () => {
    expect(eventSpawnProbability(20, DEMO_TIMING)).toBeGreaterThan(0);
    expect(eventSpawnProbability(20, SPAWN_TIMINGS.normal)).toBe(0);
    expect(eventSpawnProbability(100, DEMO_TIMING)).toBeGreaterThan(
      eventSpawnProbability(400, SPAWN_TIMINGS.normal),
    );
  });
});

describe("timingForState / уровни сложности", () => {
  it("демо-режим использует DEMO_TIMING независимо от сложности", () => {
    const state = { ...createInitialState({ demo: true, difficulty: "hard" }) };
    expect(timingForState(state)).toBe(DEMO_TIMING);
  });

  it("easy спокойнее normal, а hard тревожнее normal", () => {
    const easy = createInitialState({ difficulty: "easy" });
    const hard = createInitialState({ difficulty: "hard" });

    expect(timingForState(easy)).toBe(SPAWN_TIMINGS.easy);
    expect(timingForState(hard)).toBe(SPAWN_TIMINGS.hard);

    // спокойный период: easy длиннее normal длиннее hard
    expect(SPAWN_TIMINGS.easy.calmPeriodSec).toBeGreaterThan(
      SPAWN_TIMINGS.normal.calmPeriodSec,
    );
    expect(SPAWN_TIMINGS.normal.calmPeriodSec).toBeGreaterThan(
      SPAWN_TIMINGS.hard.calmPeriodSec,
    );

    // на плато вероятность события выше у hard, чем у easy
    expect(SPAWN_TIMINGS.hard.pMax).toBeGreaterThan(SPAWN_TIMINGS.easy.pMax);
  });

  it("hard-смена запускает событие раньше, чем easy-смена, при прочих равных", () => {
    const easy = { ...createInitialState({ difficulty: "easy" }), timeSec: 100 };
    const hard = { ...createInitialState({ difficulty: "hard" }), timeSec: 100 };

    expect(maybeAutoSpawnEvent(easy, () => 0).activeEvents).toHaveLength(0);
    expect(maybeAutoSpawnEvent(hard, () => 0).activeEvents).toHaveLength(1);
  });
});
