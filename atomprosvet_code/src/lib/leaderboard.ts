import type { Difficulty } from "../engine/types";
import type { Rank } from "../engine/scoring";

/** Один результат смены, сохранённый в локальном рейтинге браузера. */
export interface LeaderboardEntry {
  score: number;
  rank: Rank;
  difficulty: Difficulty;
  isDemo: boolean;
  failedByMeltdown: boolean;
  durationSec: number;
  achievementsCount: number;
  /** ISO-дата завершения смены. */
  dateIso: string;
}

const STORAGE_KEY = "atomprosvet.leaderboard.v1";
const MAX_ENTRIES = 10;

/** Минимальный интерфейс Storage — позволяет подставить мок в тестах
 *  вместо настоящего localStorage (недоступного в среде тестов движка). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function readAll(storage: StorageLike): LeaderboardEntry[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
  } catch {
    // localStorage недоступен (приватный режим, заблокированные данные сайта
    // и т.п.) или содержит битые данные — рейтинг просто не сохраняется,
    // это не должно ломать игру.
    return [];
  }
}

function writeAll(storage: StorageLike, entries: LeaderboardEntry[]): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // См. readAll — молча игнорируем.
  }
}

function defaultStorage(): StorageLike {
  return window.localStorage;
}

/** Текущий рейтинг, отсортированный по убыванию очков. */
export function getLeaderboard(
  storage: StorageLike = defaultStorage(),
): LeaderboardEntry[] {
  return readAll(storage).sort((a, b) => b.score - a.score);
}

/**
 * Добавляет результат смены в рейтинг (хранятся top-MAX_ENTRIES по очкам).
 * Возвращает обновлённый список и позицию нового результата (1 — лучший),
 * либо null, если результат не попал даже в топ-MAX_ENTRIES.
 */
export function saveScore(
  entry: LeaderboardEntry,
  storage: StorageLike = defaultStorage(),
): {
  entries: LeaderboardEntry[];
  position: number | null;
} {
  const merged = [...readAll(storage), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  writeAll(storage, merged);

  const position = merged.indexOf(entry);
  return { entries: merged, position: position === -1 ? null : position + 1 };
}
