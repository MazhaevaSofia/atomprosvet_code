import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { TICK_SECONDS } from "../engine/reactorEngine";

/**
 * Запускает движок симуляции: один tick() каждую TICK_SECONDS.
 * Останавливается сам, когда смена завершена, или пока enabled=false
 * (например, во время стартового экрана — часы смены ещё не должны идти).
 */
export function useSimulationLoop(enabled: boolean = true) {
  const step = useGameStore((s) => s.step);
  const isMeltdown = useGameStore((s) => s.state.isMeltdown);
  const isShiftComplete = useGameStore((s) => s.state.isShiftComplete);
  const shouldRun = enabled && !isMeltdown && !isShiftComplete;

  useEffect(() => {
    if (!shouldRun) return;
    const id = window.setInterval(() => step(), TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [step, shouldRun]);
}
