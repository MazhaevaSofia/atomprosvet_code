import type { AchievementId } from "../engine/achievements";

export interface AchievementInfo {
  id: AchievementId;
  emoji: string;
  title: string;
  description: string;
}

/** Тексты и иконки достижений — отдельно от логики их разблокировки. */
export const ACHIEVEMENTS: Record<AchievementId, AchievementInfo> = {
  "first-response": {
    id: "first-response",
    emoji: "🎓",
    title: "Первое дежурство",
    description: "Успешно отреагировали на первую нештатную ситуацию.",
  },
  "quick-reflex": {
    id: "quick-reflex",
    emoji: "⚡",
    title: "Ас реагирования",
    description: "Отреагировали на нештатную ситуацию менее чем за 5 секунд.",
  },
  "saved-from-overheat": {
    id: "saved-from-overheat",
    emoji: "🧯",
    title: "Спас станцию от перегрева",
    description: "Устранили отказ насоса охлаждения, не допустив перегрева.",
  },
  "energy-efficient": {
    id: "energy-efficient",
    emoji: "🎯",
    title: "Энергоэффективный диспетчер",
    description:
      "Удерживали баланс выработки и спроса сети в узком допуске 20 секунд подряд.",
  },
  "perfect-shift": {
    id: "perfect-shift",
    emoji: "🏅",
    title: "Идеальная смена",
    description:
      "Ни разу не позволили уровню безопасности опуститься ниже 70% за всю смену.",
  },
  "no-missed": {
    id: "no-missed",
    emoji: "🛡️",
    title: "Ни одного просчёта",
    description: "Завершили смену, не пропустив ни одной нештатной ситуации.",
  },
  "fuel-thrifty": {
    id: "fuel-thrifty",
    emoji: "⛽",
    title: "Бережливый оператор",
    description:
      "Завершили смену, сохранив не менее 60% запаса топлива — не держали мощность на максимуме бездумно.",
  },
};

export const ACHIEVEMENT_LIST: AchievementInfo[] = Object.values(ACHIEVEMENTS);
