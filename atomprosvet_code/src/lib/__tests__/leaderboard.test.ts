import { describe, expect, it } from "vitest";
import { getLeaderboard, saveScore, type StorageLike } from "../leaderboard";
import type { LeaderboardEntry } from "../leaderboard";

/** Простой in-memory Storage-мок — в тестовой среде движка (Node) нет window.localStorage. */
function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    score: 100,
    rank: "Оператор",
    difficulty: "normal",
    isDemo: false,
    failedByMeltdown: false,
    durationSec: 300,
    achievementsCount: 2,
    dateIso: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("leaderboard", () => {
  it("пустой рейтинг на старте", () => {
    expect(getLeaderboard(createMemoryStorage())).toEqual([]);
  });

  it("сохраняет результат и сообщает его позицию", () => {
    const storage = createMemoryStorage();
    const { position, entries } = saveScore(entry({ score: 50 }), storage);
    expect(position).toBe(1);
    expect(entries).toHaveLength(1);
  });

  it("сортирует по убыванию очков", () => {
    const storage = createMemoryStorage();
    saveScore(entry({ score: 50 }), storage);
    saveScore(entry({ score: 200 }), storage);
    saveScore(entry({ score: 100 }), storage);

    const list = getLeaderboard(storage);
    expect(list.map((e) => e.score)).toEqual([200, 100, 50]);
  });

  it("сообщает верную позицию для результата в середине списка", () => {
    const storage = createMemoryStorage();
    saveScore(entry({ score: 200 }), storage);
    saveScore(entry({ score: 50 }), storage);
    const { position } = saveScore(entry({ score: 100 }), storage);
    expect(position).toBe(2);
  });

  it("хранит не больше 10 результатов, отбрасывая худшие", () => {
    const storage = createMemoryStorage();
    for (let i = 0; i < 12; i++) {
      saveScore(entry({ score: i * 10 }), storage);
    }
    const list = getLeaderboard(storage);
    expect(list).toHaveLength(10);
    expect(list[0].score).toBe(110);
    expect(list[9].score).toBe(20);
  });

  it("возвращает null-позицию, если результат не попал в топ-10", () => {
    const storage = createMemoryStorage();
    for (let i = 1; i <= 10; i++) {
      saveScore(entry({ score: i * 100 }), storage);
    }
    const { position } = saveScore(entry({ score: 5 }), storage);
    expect(position).toBeNull();
  });

  it("не падает, если storage бросает исключение (приватный режим и т.п.)", () => {
    const throwingStorage: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => saveScore(entry(), throwingStorage)).not.toThrow();
    expect(getLeaderboard(throwingStorage)).toEqual([]);
  });
});
