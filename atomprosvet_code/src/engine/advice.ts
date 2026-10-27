import {
  BALANCE_TOLERANCE_MW,
  FUEL_CRITICAL_POWER_CAP,
  FUEL_CRITICAL_THRESHOLD,
  maxSustainablePower,
} from "./reactorEngine";
import {
  PRESSURE_MAX_NORMAL,
  PRESSURE_MIN_NORMAL,
  TEMPERATURE_THRESHOLDS,
  pressureZone,
  safetyZone,
  temperatureZone,
} from "./thresholds";
import type { ReactorState } from "./types";

export type AdviceLevel = "ok" | "info" | "warning" | "danger";

/** Короткая подсказка игроку: что происходит и что делать прямо сейчас. */
export interface Advice {
  level: AdviceLevel;
  text: string;
}

/** Округляем МВт до 50, чтобы текст не менялся каждую секунду вслед за шумом спроса. */
function roughMw(value: number): number {
  return Math.max(50, Math.round(Math.abs(value) / 50) * 50);
}

/**
 * Подбирает одну самую важную подсказку по текущему состоянию. Порядок
 * проверок задаёт приоритет: опасность важнее события, событие важнее
 * предупреждения, предупреждение важнее совета по балансу сети.
 */
export function getAdvice(state: ReactorState): Advice {
  const temperature = temperatureZone(state.temperature);
  const pressure = pressureZone(state.pressure);
  const safety = safetyZone(state.safety);
  const sustainable = maxSustainablePower();

  if (temperature === "danger" || pressure === "danger" || safety === "danger") {
    return {
      level: "danger",
      text: "Опасная зона. Срочно снизьте мощность. Если показатели не возвращаются в норму, нажмите «Аварийная защита».",
    };
  }

  const event = state.activeEvents[0];
  if (event) {
    return {
      level: "warning",
      text: `Нештатная ситуация: «${event.title}». Откройте панель «Тревоги» и отреагируйте, пока идёт таймер.`,
    };
  }

  if (temperature === "warning") {
    return {
      level: "warning",
      text: `Температура выше нормы (больше ${TEMPERATURE_THRESHOLDS.normalMax} °C). Снизьте мощность до ${sustainable}% или ниже, иначе безопасность начнёт падать.`,
    };
  }

  if (pressure === "warning") {
    return {
      level: "warning",
      text:
        state.pressure < PRESSURE_MIN_NORMAL
          ? `Давление ниже нормы (${PRESSURE_MIN_NORMAL}-${PRESSURE_MAX_NORMAL} МПа). Плавно поднимите мощность.`
          : `Давление выше нормы (${PRESSURE_MIN_NORMAL}-${PRESSURE_MAX_NORMAL} МПа). Оно растёт вместе с температурой: снизьте мощность.`,
    };
  }

  if (safety === "warning") {
    return {
      level: "warning",
      text: "Уровень безопасности снижен. Верните температуру и давление в норму, и он начнёт восстанавливаться.",
    };
  }

  if (state.fuelLevel <= FUEL_CRITICAL_THRESHOLD) {
    return {
      level: "warning",
      text: `Топливо на исходе: мощность больше ${FUEL_CRITICAL_POWER_CAP}% не поднимется. Берегите остаток до конца смены.`,
    };
  }

  if (Math.abs(state.targetPower - state.power) > 1) {
    return {
      level: "info",
      text: "Мощность плавно выходит на заданное значение. Это занимает несколько секунд, подождите.",
    };
  }

  const balance = state.energyOutput - state.gridDemand;
  if (balance < -BALANCE_TOLERANCE_MW) {
    return state.targetPower >= sustainable
      ? {
          level: "info",
          text: `Сети не хватает примерно ${roughMw(balance)} МВт, но мощность уже у предела без перегрева (${sustainable}%). Лучше оставить как есть.`,
        }
      : {
          level: "info",
          text: `Выработка ниже спроса сети примерно на ${roughMw(balance)} МВт. Если всё в норме, можно плавно поднять мощность.`,
        };
  }
  if (balance > BALANCE_TOLERANCE_MW) {
    return {
      level: "info",
      text: `Выработка выше спроса сети примерно на ${roughMw(balance)} МВт. Можно снизить мощность: так вы сэкономите топливо.`,
    };
  }

  return {
    level: "ok",
    text: "Всё в норме. Старайтесь держать выработку близко к спросу сети.",
  };
}
