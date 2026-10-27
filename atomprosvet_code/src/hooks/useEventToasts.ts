import { useEffect, useRef, useState } from "react";
import type { ActiveEvent } from "../engine/types";
import { playAlarmBeep } from "../lib/sound";

const TOAST_DURATION_MS = 6000;

/**
 * Отслеживает появление новых нештатных событий в activeEvents и на каждое
 * новое показывает всплывающее уведомление + проигрывает звуковой сигнал.
 * Уведомление само исчезает через TOAST_DURATION_MS (но карточка события в
 * AlertsPanel остаётся до решения/истечения таймера).
 */
export function useEventToasts(activeEvents: ActiveEvent[]) {
  const knownIds = useRef<Set<string>>(new Set());
  // Таймеры автозакрытия живут независимо от того, как часто перезапускается
  // нижний эффект (activeEvents — новый массив на каждом тике): если чистить
  // их при каждом перезапуске эффекта, они бы никогда не успевали сработать.
  const pendingTimers = useRef<number[]>([]);
  const [toasts, setToasts] = useState<ActiveEvent[]>([]);

  useEffect(() => {
    const fresh = activeEvents.filter((e) => !knownIds.current.has(e.id));
    if (fresh.length === 0) return;

    fresh.forEach((e) => knownIds.current.add(e.id));
    setToasts((prev) => [...prev, ...fresh]);
    playAlarmBeep();

    fresh.forEach((e) => {
      const timerId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== e.id));
      }, TOAST_DURATION_MS);
      pendingTimers.current.push(timerId);
    });
  }, [activeEvents]);

  // Таймеры очищаются только при размонтировании компонента.
  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, dismiss };
}
