import {
  PRESSURE_MAX_NORMAL,
  PRESSURE_MAX_WARNING,
  PRESSURE_MIN_NORMAL,
  PRESSURE_MIN_WARNING,
  TEMPERATURE_MELTDOWN,
  TEMPERATURE_THRESHOLDS,
} from "./thresholds";
import type { Difficulty, EventLogEntry, ReactorState, UserActions } from "./types";

/** Длина одного шага симуляции, сек. Движок вызывается раз в секунду. */
export const TICK_SECONDS = 1;

/** Максимальная скорость изменения мощности, %/сек — защита от мгновенных скачков. */
const MAX_POWER_RATE = 3;

/** Базовые (минимальная/максимальная) равновесные температуры при coolantFlow = 100%. */
const TEMP_AT_ZERO_POWER = 220;
const TEMP_AT_FULL_POWER = 385;
/** Насколько сильно просевший coolantFlow поднимает равновесную температуру. */
const TEMP_COOLANT_PENALTY = 1.6;
/** Инерция приближения фактической температуры к равновесной (доля за тик). */
const TEMP_APPROACH_RATE = 0.12;

/** Связь давления с температурой. */
const PRESSURE_PER_DEGREE = 0.045;
const PRESSURE_BASE = -3;
const PRESSURE_NOISE_AMPLITUDE = 0.3;

/** Скорость деградации/восстановления безопасности, %/сек в опасной/нормальной зоне. */
const SAFETY_DECAY_RATE = 4;
const SAFETY_RECOVERY_RATE = 1.5;

/** Мощность полной ёмкости энергоблока, МВт при power = 100%. */
const CAPACITY_MW = 1200;

/** Базовый и амплитудный спрос сети (синусоида для «живости» + случайность). */
const GRID_DEMAND_BASE = 700;
const GRID_DEMAND_AMPLITUDE = 150;

// --- Эффекты нештатных событий (Этап 5) -----------------------------------
// Каждый активный сценарий временно меняет поведение соответствующей части
// модели, пока событие не решено или не истёк таймер реакции.

/** pump-failure: на сколько %/сек проседает coolantFlow, пока насос не заменят. */
const PUMP_FAILURE_COOLANT_DROP = 8;
/** grid-spike: дополнительный скачок спроса сети, МВт. */
const GRID_SPIKE_BOOST_MW = 320;
/** maintenance: до какой мощности автоматически ограничивается блок. */
const MAINTENANCE_POWER_CAP = 40;
/** extreme-weather: во сколько раз усиливается случайная раскачка спроса сети. */
const EXTREME_WEATHER_NOISE_MULTIPLIER = 4;

// --- Углубление симуляции: топливо и аварийная защита ----------------------

/** Расход топлива, %/сек при мощности 100% (линейно меньше на меньшей мощности).
 *  Подобрано так, что теоретически непрерывная работа на 100% успела бы
 *  дойти до критического порога в пределах длительности обычной смены
 *  (300 сек) — на практике держать 100% так долго и без того рискованно:
 *  безопасность в этой зоне непрерывно падает и раньше грозит аварией,
 *  так что расход топлива работает как вторая, параллельная причина не
 *  держать мощность на максимуме бездумно, а не отдельный независимый таймер. */
export const FUEL_CONSUMPTION_RATE_PER_SEC = 0.3;
/** Ниже этого запаса топлива реактор физически не может выйти на полную мощность. */
export const FUEL_CRITICAL_THRESHOLD = 20;
/** Максимальная достижимая мощность при критически низком запасе топлива. */
export const FUEL_CRITICAL_POWER_CAP = 50;
/** Штраф очков за срабатывание ручной аварийной защиты (АЗ) — экономическая
 *  цена внепланового останова, как и на настоящей станции. */
export const SCRAM_SCORE_PENALTY = 25;

// --- Геймификация (Этап 6) -------------------------------------------------

/** Длительность обычной смены: по её истечении симуляция штатно завершается. */
export const SHIFT_DURATION_SEC = 300; // 5 минут
/** Длительность демо-смены для питч-сессии (Этап 9) — укладывается в 2.5 минуты. */
export const DEMO_SHIFT_DURATION_SEC = 150;
/** Допуск баланса выработки/спроса для стрика «энергоэффективный диспетчер», МВт. */
export const BALANCE_TOLERANCE_MW = 40;

export interface CreateInitialStateOptions {
  /** Демо-режим: короче смена, события начинаются раньше и идут чаще (см. engine/events.ts). */
  demo?: boolean;
  /** Уровень сложности (игнорируется в демо-режиме). По умолчанию "normal". */
  difficulty?: Difficulty;
}

export function createInitialState(
  options: CreateInitialStateOptions = {},
): ReactorState {
  const isDemo = options.demo ?? false;
  return {
    timeSec: 0,
    power: 50,
    targetPower: 50,
    temperature: 280,
    pressure: 9,
    coolantFlow: 100,
    safety: 100,
    fuelLevel: 100,
    energyOutput: (CAPACITY_MW * 50) / 100,
    cityShare: 60,
    industryShare: 40,
    gridDemand: GRID_DEMAND_BASE,
    activeEvents: [],
    eventLog: [],
    score: 0,
    minSafetySoFar: 100,
    balanceStreakSec: 0,
    isMeltdown: false,
    isShiftComplete: false,
    shiftDurationSec: isDemo ? DEMO_SHIFT_DURATION_SEC : SHIFT_DURATION_SEC,
    isDemo,
    difficulty: options.difficulty ?? "normal",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Детерминированный «шум» без Math.random, чтобы движок оставался тестируемым. */
function pseudoNoise(timeSec: number): number {
  return Math.sin(timeSec * 1.7) * 0.5 + Math.sin(timeSec * 0.53) * 0.5;
}

/**
 * Наибольшая мощность, при которой и температура, и давление в
 * установившемся режиме остаются в норме: длительно держать мощность выше
 * этого значения значит медленно терять безопасность. Давление упирается в
 * свой предел раньше температуры (с учётом его колебаний), поэтому предел
 * считается по более строгому из двух. Выводится из констант модели, чтобы
 * подсказки в интерфейсе не расходились с физикой.
 */
export function maxSustainablePower(): number {
  const temperatureLimit = TEMPERATURE_THRESHOLDS.normalMax;
  const pressureLimit =
    (PRESSURE_MAX_NORMAL - PRESSURE_BASE - PRESSURE_NOISE_AMPLITUDE) /
    PRESSURE_PER_DEGREE;
  const ratio =
    (Math.min(temperatureLimit, pressureLimit) - TEMP_AT_ZERO_POWER) /
    (TEMP_AT_FULL_POWER - TEMP_AT_ZERO_POWER);
  return Math.floor(ratio * 100);
}

function equilibriumTemperature(power: number, coolantFlow: number): number {
  const base =
    TEMP_AT_ZERO_POWER + (TEMP_AT_FULL_POWER - TEMP_AT_ZERO_POWER) * (power / 100);
  const coolantDeficit = clamp(100 - coolantFlow, 0, 100);
  return base + coolantDeficit * TEMP_COOLANT_PENALTY;
}

function nextSafety(
  safety: number,
  temperature: number,
  pressure: number,
): number {
  const tempDanger = temperature > TEMPERATURE_THRESHOLDS.warningMax;
  const tempWarning = temperature > TEMPERATURE_THRESHOLDS.normalMax;
  const pressureDanger =
    pressure > PRESSURE_MAX_WARNING || pressure < PRESSURE_MIN_WARNING;
  const pressureWarning =
    !pressureDanger &&
    (pressure > PRESSURE_MAX_NORMAL || pressure < PRESSURE_MIN_NORMAL);

  const inDanger = tempDanger || pressureDanger;
  const inWarning = !inDanger && (tempWarning || pressureWarning);

  if (inDanger) return clamp(safety - SAFETY_DECAY_RATE, 0, 100);
  if (inWarning) return clamp(safety - SAFETY_DECAY_RATE * 0.4, 0, 100);
  return clamp(safety + SAFETY_RECOVERY_RATE, 0, 100);
}

function nextGridDemand(
  timeSec: number,
  gridSpikeActive: boolean,
  extremeWeatherActive: boolean,
): number {
  const noiseMultiplier = extremeWeatherActive ? EXTREME_WEATHER_NOISE_MULTIPLIER : 1;
  const spike = gridSpikeActive ? GRID_SPIKE_BOOST_MW : 0;
  return (
    GRID_DEMAND_BASE +
    GRID_DEMAND_AMPLITUDE * Math.sin(timeSec / 45) +
    pseudoNoise(timeSec) * 20 * noiseMultiplier +
    spike
  );
}

/**
 * Один шаг симуляции: чистая функция без побочных эффектов.
 * tick(state, actions) -> newState
 */
export function tick(state: ReactorState, actions: UserActions = {}): ReactorState {
  if (state.isMeltdown || state.isShiftComplete) {
    return state;
  }

  const timeSec = state.timeSec + TICK_SECONDS;

  const activeScenario = (id: string) =>
    state.activeEvents.some((e) => e.scenarioId === id && !e.resolved);
  const pumpFailureActive = activeScenario("pump-failure");
  const gridSpikeActive = activeScenario("grid-spike");
  const maintenanceActive = activeScenario("maintenance");
  const extremeWeatherActive = activeScenario("extreme-weather");

  const scramActive = actions.triggerScram === true;

  const requestedTargetPower =
    actions.setTargetPower !== undefined
      ? clamp(actions.setTargetPower, 0, 100)
      : state.targetPower;
  // Во время планового ТО и при критическом запасе топлива блок физически не
  // может выйти выше ограниченной мощности — targetPower при этом не трогаем,
  // чтобы UI сохранял намерение пользователя и вернулся к нему сам, как
  // только ограничение снимется.
  const fuelPowerCap =
    state.fuelLevel <= FUEL_CRITICAL_THRESHOLD ? FUEL_CRITICAL_POWER_CAP : 100;
  const powerCap = maintenanceActive
    ? Math.min(MAINTENANCE_POWER_CAP, fuelPowerCap)
    : fuelPowerCap;
  const effectiveTargetPower = Math.min(requestedTargetPower, powerCap);

  // Ручная аварийная защита (АЗ): в реальности стержни СУЗ падают в активную
  // зону за секунды — в отличие от обычного плавного управления, это
  // единственное место, где мощность меняется мгновенно, а не по MAX_POWER_RATE.
  const targetPower = scramActive ? 0 : requestedTargetPower;
  const power = scramActive
    ? 0
    : clamp(
        state.power +
          clamp(effectiveTargetPower - state.power, -MAX_POWER_RATE, MAX_POWER_RATE),
        0,
        100,
      );

  // coolantFlow восстанавливается к 100%, если ни одно активное событие его не подавляет.
  const coolantFlow = pumpFailureActive
    ? clamp(state.coolantFlow - PUMP_FAILURE_COOLANT_DROP, 20, 100)
    : clamp(state.coolantFlow + 5, 0, 100);

  // Топливо расходуется пропорционально мощности — чем выше держать мощность,
  // тем быстрее садится запас и тем раньше сработает fuelPowerCap.
  const fuelLevel = clamp(
    state.fuelLevel - (power / 100) * FUEL_CONSUMPTION_RATE_PER_SEC,
    0,
    100,
  );

  const eqTemp = equilibriumTemperature(power, coolantFlow);
  const temperature =
    state.temperature + (eqTemp - state.temperature) * TEMP_APPROACH_RATE;

  const pressure =
    PRESSURE_BASE +
    temperature * PRESSURE_PER_DEGREE +
    pseudoNoise(timeSec) * PRESSURE_NOISE_AMPLITUDE;

  const safety = nextSafety(state.safety, temperature, pressure);
  const isMeltdown = temperature >= TEMPERATURE_MELTDOWN || safety <= 0;

  const cityShare =
    actions.setCityShare !== undefined
      ? clamp(actions.setCityShare, 0, 100)
      : state.cityShare;
  const industryShare = 100 - cityShare;

  const coolantLossFactor = clamp(coolantFlow / 100, 0.4, 1);
  const energyOutput = (CAPACITY_MW * power) / 100 * coolantLossFactor;

  const gridDemand = nextGridDemand(timeSec, gridSpikeActive, extremeWeatherActive);

  const resolveIds = new Set(actions.resolveEventIds ?? []);
  const stillActive: typeof state.activeEvents = [];
  const newLogEntries: EventLogEntry[] = [];

  for (const event of state.activeEvents) {
    const resolvedNow = resolveIds.has(event.id);
    const expired = timeSec - event.startedAt >= event.reactionWindowSec;

    if (resolvedNow) {
      newLogEntries.push({
        id: event.id,
        scenarioId: event.scenarioId,
        title: event.title,
        endedAt: timeSec,
        reactionSec: timeSec - event.startedAt,
        outcome: "handled",
      });
    } else if (expired) {
      newLogEntries.push({
        id: event.id,
        scenarioId: event.scenarioId,
        title: event.title,
        endedAt: timeSec,
        reactionSec: timeSec - event.startedAt,
        outcome: "missed",
      });
    } else {
      stillActive.push(event);
    }
  }

  const eventLog = [...state.eventLog, ...newLogEntries].slice(-10);

  const scoreDelta =
    (safety >= 70 ? 1 : 0) +
    newLogEntries.filter((e) => e.outcome === "handled").length * 10 -
    newLogEntries.filter((e) => e.outcome === "missed").length * 5 -
    (scramActive ? SCRAM_SCORE_PENALTY : 0);

  const minSafetySoFar = Math.min(state.minSafetySoFar, safety);

  const balance = energyOutput - gridDemand;
  const balanceStreakSec =
    Math.abs(balance) <= BALANCE_TOLERANCE_MW ? state.balanceStreakSec + 1 : 0;

  const isShiftComplete = timeSec >= state.shiftDurationSec;

  return {
    timeSec,
    power,
    targetPower,
    temperature,
    pressure,
    coolantFlow,
    safety,
    fuelLevel,
    energyOutput,
    cityShare,
    industryShare,
    gridDemand,
    activeEvents: stillActive,
    eventLog,
    score: state.score + scoreDelta,
    minSafetySoFar,
    balanceStreakSec,
    isMeltdown,
    isShiftComplete,
    shiftDurationSec: state.shiftDurationSec,
    isDemo: state.isDemo,
    difficulty: state.difficulty,
  };
}
