import { create } from "zustand";
import {
  createInitialState,
  tick,
  type CreateInitialStateOptions,
} from "../engine/reactorEngine";
import { maybeAutoSpawnEvent } from "../engine/events";
import {
  evaluateEndOfShiftAchievements,
  evaluateLiveAchievements,
  type AchievementId,
} from "../engine/achievements";
import type { ReactorState, UserActions } from "../engine/types";

/** Точка истории показателей для графика (последние 60 секунд). */
export interface HistorySample {
  timeSec: number;
  power: number;
  temperature: number;
  pressure: number;
  safety: number;
}

const HISTORY_LENGTH = 60;

function sampleFrom(state: ReactorState): HistorySample {
  return {
    timeSec: state.timeSec,
    power: state.power,
    temperature: state.temperature,
    pressure: state.pressure,
    safety: state.safety,
  };
}

interface GameStore {
  state: ReactorState;
  history: HistorySample[];
  /** Все достижения, разблокированные за текущую смену, в порядке получения. */
  unlockedAchievements: AchievementId[];

  /** Продвинуть симуляцию на один тик, опционально применив действия пользователя. */
  step: (actions?: UserActions) => void;
  /** Задать целевую мощность (применяется на следующем тике). */
  setTargetPower: (power: number) => void;
  /** Задать долю выработки, направляемую в город (применяется немедленно). */
  setCityShare: (share: number) => void;
  /** Отметить активное событие решённым (применяется немедленно). */
  resolveEvent: (eventId: string) => void;
  /** Ручная аварийная защита (АЗ): мгновенно роняет мощность до 0 ценой штрафа очков. */
  triggerScram: () => void;
  /** Досрочно завершить смену («Завершить смену»). */
  endShift: () => void;
  /** Сбросить смену к начальному состоянию (demo, difficulty — см. createInitialState). */
  reset: (options?: CreateInitialStateOptions) => void;
}

function unlockAchievements(
  already: AchievementId[],
  newlyQualified: AchievementId[],
): AchievementId[] {
  const toAdd = newlyQualified.filter((id) => !already.includes(id));
  return toAdd.length > 0 ? [...already, ...toAdd] : already;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  history: [sampleFrom(createInitialState())],
  unlockedAchievements: [],

  step: (actions) => {
    const ticked = tick(get().state, actions);
    // Случайные нештатные события подмешиваются поверх детерминированного
    // tick() — сам движок остаётся чистым и тестируемым, а реальная
    // случайность (Math.random по умолчанию) живёт только здесь, в сторе.
    const nextState = maybeAutoSpawnEvent(ticked);
    const history = [...get().history, sampleFrom(nextState)].slice(
      -HISTORY_LENGTH,
    );

    const qualified = evaluateLiveAchievements(nextState);
    const shiftJustEnded = nextState.isShiftComplete || nextState.isMeltdown;
    if (shiftJustEnded) {
      qualified.push(...evaluateEndOfShiftAchievements(nextState));
    }
    const unlockedAchievements = unlockAchievements(
      get().unlockedAchievements,
      qualified,
    );

    set({ state: nextState, history, unlockedAchievements });
  },

  setTargetPower: (power) => get().step({ setTargetPower: power }),

  setCityShare: (share) => get().step({ setCityShare: share }),

  resolveEvent: (eventId) => get().step({ resolveEventIds: [eventId] }),

  triggerScram: () => get().step({ triggerScram: true }),

  endShift: () => {
    const finalState = { ...get().state, isShiftComplete: true };
    const qualified = [
      ...evaluateLiveAchievements(finalState),
      ...evaluateEndOfShiftAchievements(finalState),
    ];
    set({
      state: finalState,
      unlockedAchievements: unlockAchievements(
        get().unlockedAchievements,
        qualified,
      ),
    });
  },

  reset: (options) => {
    const initial = createInitialState(options);
    set({ state: initial, history: [sampleFrom(initial)], unlockedAchievements: [] });
  },
}));
