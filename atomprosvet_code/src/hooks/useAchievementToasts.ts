import { useEffect, useRef, useState } from "react";
import type { AchievementId } from "../engine/achievements";

const TOAST_DURATION_MS = 5000;

/**
 * Показывает анимированное всплывающее уведомление на каждое НОВОЕ
 * достижение в unlockedAchievements (сравнивает с уже показанными).
 * По устройству зеркалит useEventToasts.
 */
export function useAchievementToasts(unlockedAchievements: AchievementId[]) {
  const shownIds = useRef<Set<AchievementId>>(new Set());
  const pendingTimers = useRef<number[]>([]);
  const [toasts, setToasts] = useState<AchievementId[]>([]);

  useEffect(() => {
    // Смену сбросили («Начать заново») — список пуст, хотя мы что-то уже
    // показывали. Забываем историю, чтобы те же достижения снова
    // засчитывались в новой смене.
    if (unlockedAchievements.length === 0 && shownIds.current.size > 0) {
      shownIds.current.clear();
      return;
    }

    const fresh = unlockedAchievements.filter((id) => !shownIds.current.has(id));
    if (fresh.length === 0) return;

    fresh.forEach((id) => shownIds.current.add(id));
    setToasts((prev) => [...prev, ...fresh]);

    fresh.forEach((id) => {
      const timerId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t !== id));
      }, TOAST_DURATION_MS);
      pendingTimers.current.push(timerId);
    });
  }, [unlockedAchievements]);

  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const dismiss = (id: AchievementId) =>
    setToasts((prev) => prev.filter((t) => t !== id));

  return { toasts, dismiss };
}
