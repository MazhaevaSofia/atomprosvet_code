/**
 * Подписи кнопок реакции на нештатные ситуации. Вместо одинакового
 * «Отреагировать» игрок видит, что именно он делает. Отдельно от кода
 * интерфейса, чтобы тексты было легко править.
 */
export const EVENT_ACTION_LABELS: Record<string, string> = {
  "pump-failure": "Включить резервный насос",
  "grid-spike": "Перераспределить нагрузку",
  maintenance: "Подтвердить ограничение мощности",
  "extreme-weather": "Подстроить баланс сети",
};

export const DEFAULT_EVENT_ACTION_LABEL = "Отреагировать";

export function eventActionLabel(scenarioId: string): string {
  return EVENT_ACTION_LABELS[scenarioId] ?? DEFAULT_EVENT_ACTION_LABEL;
}
