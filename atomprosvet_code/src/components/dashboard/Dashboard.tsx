import { useGameStore } from "../../store/useGameStore";
import { getAdvice } from "../../engine/advice";
import { maxSustainablePower } from "../../engine/reactorEngine";
import {
  PRESSURE_MAX_NORMAL,
  PRESSURE_MIN_NORMAL,
  SAFETY_THRESHOLDS,
  TEMPERATURE_THRESHOLDS,
  pressureZone,
  safetyZone,
  temperatureZone,
} from "../../engine/thresholds";
import { parameterInfo } from "../../data/tooltips";
import { ACHIEVEMENT_LIST } from "../../data/achievements";
import { DIFFICULTIES } from "../../data/difficulty";
import { ConfirmButton } from "../common/ConfirmButton";
import { FullscreenButton } from "../common/FullscreenButton";
import { AdviceBanner } from "./AdviceBanner";
import { Gauge } from "./Gauge";
import { PowerControl } from "./PowerControl";
import { HistoryChart } from "./HistoryChart";
import { EnergyDistribution } from "./EnergyDistribution";
import { AlertsPanel } from "./AlertsPanel";
import { EventLog } from "./EventLog";

function formatShiftTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TOOLBAR_BUTTON =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-700 active:scale-95";

interface DashboardProps {
  onOpenFacts: () => void;
  onOpenHelp: () => void;
  onOpenGuide: () => void;
}

export function Dashboard({ onOpenFacts, onOpenHelp, onOpenGuide }: DashboardProps) {
  const state = useGameStore((s) => s.state);
  const history = useGameStore((s) => s.history);
  const setTargetPower = useGameStore((s) => s.setTargetPower);
  const setCityShare = useGameStore((s) => s.setCityShare);
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  const triggerScram = useGameStore((s) => s.triggerScram);
  const endShift = useGameStore((s) => s.endShift);
  const reset = useGameStore((s) => s.reset);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);

  const advice = getAdvice(state);
  const shiftProgress = Math.min(100, (state.timeSec / state.shiftDurationSec) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-50">
                АтомПросвет <span className="font-normal text-zinc-400">пульт управления</span>
              </h1>
              {state.isDemo && (
                <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                  Демо
                </span>
              )}
              {!state.isDemo && state.difficulty !== "normal" && (
                <span className="rounded-full border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                  {DIFFICULTIES.find((d) => d.id === state.difficulty)?.label}
                </span>
              )}
            </div>
            <dl className="flex items-center gap-5 font-mono text-base text-zinc-300">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-sm text-zinc-400">Смена</dt>
                <dd>
                  {formatShiftTime(state.timeSec)}
                  <span className="text-zinc-400"> из {formatShiftTime(state.shiftDurationSec)}</span>
                </dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-sm text-zinc-400">Очки</dt>
                <dd className="text-zinc-50">{state.score}</dd>
              </div>
              <div
                className="flex items-baseline gap-1.5"
                title="Разблокировано достижений"
              >
                <dt className="text-sm text-zinc-400">🏅</dt>
                <dd>
                  {unlockedAchievements.length}/{ACHIEVEMENT_LIST.length}
                </dd>
              </div>
            </dl>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-label="Прогресс смены"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(shiftProgress)}
          >
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-1000 ease-linear"
              style={{ width: `${shiftProgress}%` }}
            />
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-zinc-400">Помощь:</span>
            <button type="button" onClick={onOpenGuide} className={TOOLBAR_BUTTON}>
              Как играть
            </button>
            <button type="button" onClick={onOpenHelp} className={TOOLBAR_BUTTON}>
              Справка
            </button>
            <button type="button" onClick={onOpenFacts} className={TOOLBAR_BUTTON}>
              Факты
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FullscreenButton />
            <ConfirmButton
              label="Завершить смену"
              confirmLabel="Точно завершить?"
              onConfirm={endShift}
              className="rounded-lg border border-amber-700/50 bg-amber-900/20 px-3 py-1.5 text-sm text-amber-200 transition hover:bg-amber-900/40 active:scale-95"
              confirmClassName="rounded-lg border border-amber-400 bg-amber-500/30 px-3 py-1.5 text-sm font-semibold text-amber-100 transition active:scale-95"
            />
            <ConfirmButton
              label="Начать заново"
              confirmLabel="Сбросить прогресс?"
              onConfirm={() =>
                reset({ demo: state.isDemo, difficulty: state.difficulty })
              }
              className={TOOLBAR_BUTTON}
              confirmClassName="rounded-lg border border-zinc-300 bg-zinc-600 px-3 py-1.5 text-sm font-semibold text-zinc-50 transition active:scale-95"
            />
          </div>
        </div>

        <AdviceBanner advice={advice} />

        {/* Порядок в DOM: шкалы, тревоги и управление, график. На узких экранах
            так тревоги и управление мощностью оказываются сразу под шкалами, а не
            в самом низу; на широких (lg) сетка возвращает правую колонку вправо. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:col-start-1 lg:row-start-1">
            <Gauge
              label="Мощность"
              value={state.power}
              min={0}
              max={100}
              unit="%"
              rangeHint={`без перегрева длительно: до ${maxSustainablePower()}%`}
              tooltip={parameterInfo("power").short}
            />
            <Gauge
              label="Температура"
              value={state.temperature}
              min={150}
              max={500}
              unit="°C"
              zoneFn={temperatureZone}
              rangeHint={`норма: до ${TEMPERATURE_THRESHOLDS.normalMax} °C`}
              tooltip={parameterInfo("temperature").short}
            />
            <Gauge
              label="Давление"
              value={state.pressure}
              min={0}
              max={20}
              unit="МПа"
              precision={1}
              zoneFn={pressureZone}
              rangeHint={`норма: ${PRESSURE_MIN_NORMAL}-${PRESSURE_MAX_NORMAL} МПа`}
              tooltip={parameterInfo("pressure").short}
            />
            <Gauge
              label="Безопасность"
              value={state.safety}
              min={0}
              max={100}
              unit="%"
              zoneFn={safetyZone}
              rangeHint={`норма: от ${SAFETY_THRESHOLDS.warningMax}%`}
              tooltip={parameterInfo("safety").short}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-6">
            <AlertsPanel
              activeEvents={state.activeEvents}
              timeSec={state.timeSec}
              onResolve={resolveEvent}
            />
            <PowerControl
              targetPower={state.targetPower}
              power={state.power}
              fuelLevel={state.fuelLevel}
              onChange={setTargetPower}
              onScram={triggerScram}
            />
            <EventLog entries={state.eventLog} />
          </div>

          <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-2 lg:gap-6">
            <HistoryChart history={history} />
            <EnergyDistribution
              energyOutput={state.energyOutput}
              gridDemand={state.gridDemand}
              cityShare={state.cityShare}
              industryShare={state.industryShare}
              onCityShareChange={setCityShare}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
