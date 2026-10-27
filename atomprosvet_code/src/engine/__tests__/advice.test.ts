import { describe, expect, it } from "vitest";
import { getAdvice } from "../advice";
import { createInitialState, maxSustainablePower } from "../reactorEngine";
import { spawnEvent } from "../events";
import type { ReactorState } from "../types";

/** Спокойное состояние: выработка совпадает со спросом, всё в норме. */
function calm(overrides: Partial<ReactorState> = {}): ReactorState {
  return {
    ...createInitialState(),
    energyOutput: 700,
    gridDemand: 700,
    ...overrides,
  };
}

describe("maxSustainablePower", () => {
  it("лежит между 0 и 100 и соответствует границе нормы температуры", () => {
    const limit = maxSustainablePower();
    expect(limit).toBeGreaterThan(50);
    expect(limit).toBeLessThan(100);
  });
});

describe("getAdvice", () => {
  it("в спокойной обстановке говорит, что всё в норме", () => {
    expect(getAdvice(calm()).level).toBe("ok");
  });

  it("опасная температура важнее всего остального", () => {
    const state = spawnEvent(calm({ temperature: 420 }), "grid-spike");
    const advice = getAdvice(state);
    expect(advice.level).toBe("danger");
    expect(advice.text).toContain("Аварийная защита");
  });

  it("активное событие важнее предупреждения о температуре", () => {
    const state = spawnEvent(calm({ temperature: 370 }), "pump-failure");
    const advice = getAdvice(state);
    expect(advice.level).toBe("warning");
    expect(advice.text).toContain("Тревоги");
  });

  it("температура выше нормы советует снизить мощность до безопасной", () => {
    const advice = getAdvice(calm({ temperature: 370 }));
    expect(advice.level).toBe("warning");
    expect(advice.text).toContain(`${maxSustainablePower()}%`);
  });

  it("давление ниже нормы советует поднять мощность, выше нормы снизить", () => {
    const low = getAdvice(calm({ pressure: 5 }));
    const high = getAdvice(calm({ pressure: 13 }));
    expect(low.text).toContain("поднимите");
    expect(high.text).toContain("снизьте");
  });

  it("предупреждает о критически низком запасе топлива", () => {
    const advice = getAdvice(calm({ fuelLevel: 10 }));
    expect(advice.level).toBe("warning");
    expect(advice.text).toContain("Топливо");
  });

  it("пока мощность выходит на цель, просит подождать, а не двигать ползунок", () => {
    const advice = getAdvice(calm({ power: 50, targetPower: 80 }));
    expect(advice.level).toBe("info");
    expect(advice.text).toContain("подождите");
  });

  it("при дефиците сети советует поднять мощность", () => {
    const advice = getAdvice(calm({ energyOutput: 500, targetPower: 50, power: 50 }));
    expect(advice.level).toBe("info");
    expect(advice.text).toContain("поднять");
  });

  it("при дефиците, но мощности у предела, не толкает к перегреву", () => {
    const limit = maxSustainablePower();
    const advice = getAdvice(
      calm({ energyOutput: 500, targetPower: limit, power: limit }),
    );
    expect(advice.text).toContain("Лучше оставить");
  });

  it("при избытке выработки советует сэкономить топливо", () => {
    const advice = getAdvice(calm({ energyOutput: 900 }));
    expect(advice.level).toBe("info");
    expect(advice.text).toContain("сэкономите топливо");
  });

  it("не меняет текст от малых колебаний спроса (округление до 50 МВт)", () => {
    const a = getAdvice(calm({ energyOutput: 600, gridDemand: 712 }));
    const b = getAdvice(calm({ energyOutput: 600, gridDemand: 718 }));
    expect(a.text).toBe(b.text);
  });
});
