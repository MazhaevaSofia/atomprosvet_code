import type { Difficulty } from "../engine/types";

export interface DifficultyInfo {
  id: Difficulty;
  label: string;
  description: string;
}

/** Тексты уровней сложности — отдельно от логики их применения. */
export const DIFFICULTIES: DifficultyInfo[] = [
  {
    id: "easy",
    label: "Лёгкий",
    description: "Спокойный период дольше, события реже. Хорошо для первой смены.",
  },
  {
    id: "normal",
    label: "Обычный",
    description: "Сбалансированный тренажёр — таким он задумывался.",
  },
  {
    id: "hard",
    label: "Сложный",
    description: "Спокойный период короче, события идут чаще и настойчивее.",
  },
];
