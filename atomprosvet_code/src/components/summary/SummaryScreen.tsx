import { useEffect, useRef, useState } from "react";
import { buildShiftSummary } from "../../engine/scoring";
import type { AchievementId } from "../../engine/achievements";
import type { ReactorState } from "../../engine/types";
import { ACHIEVEMENT_LIST } from "../../data/achievements";
import { DIFFICULTIES } from "../../data/difficulty";
import { saveScore, type LeaderboardEntry } from "../../lib/leaderboard";

interface SummaryScreenProps {
  state: ReactorState;
  unlockedAchievementIds: AchievementId[];
  onRestart: () => void;
}

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatEntryDate(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function difficultyLabel(entry: LeaderboardEntry): string {
  if (entry.isDemo) return "демо";
  return DIFFICULTIES.find((d) => d.id === entry.difficulty)?.label ?? "";
}

export function SummaryScreen({
  state,
  unlockedAchievementIds,
  onRestart,
}: SummaryScreenProps) {
  const summary = buildShiftSummary(state, unlockedAchievementIds);
  const unlockedSet = new Set(unlockedAchievementIds);

  // Результат смены сохраняется в локальный рейтинг браузера (localStorage)
  // один раз, при первом появлении этого экрана — SummaryScreen монтируется
  // заново на каждую новую смену (см. App.tsx). savedOnceRef защищает от
  // двойного сохранения при двойном вызове эффекта в React StrictMode (dev).
  const savedOnceRef = useRef(false);
  const [leaderboard, setLeaderboard] = useState<{
    entries: LeaderboardEntry[];
    position: number | null;
  } | null>(null);

  useEffect(() => {
    if (savedOnceRef.current) return;
    savedOnceRef.current = true;

    const result = saveScore({
      score: summary.score,
      rank: summary.rank,
      difficulty: state.difficulty,
      isDemo: state.isDemo,
      failedByMeltdown: summary.failedByMeltdown,
      durationSec: summary.durationSec,
      achievementsCount: unlockedAchievementIds.length,
      dateIso: new Date().toISOString(),
    });
    // Запись в localStorage — эффект во внешнюю систему; setState здесь
    // единожды отражает его результат в UI (не "производное состояние",
    // которое стоило бы вычислять прямо при рендере).
    setLeaderboard(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сохраняем один раз на смонтированную смену
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="flex items-center gap-2">
          <p
            className={
              summary.failedByMeltdown
                ? "text-sm font-semibold text-rose-400"
                : "text-sm font-semibold text-emerald-400"
            }
          >
            {summary.failedByMeltdown
              ? "Смена прервана аварией"
              : "Смена успешно завершена"}
          </p>
          {state.isDemo && (
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-300 uppercase">
              Демо
            </span>
          )}
          {!state.isDemo && state.difficulty !== "normal" && (
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
              {DIFFICULTIES.find((d) => d.id === state.difficulty)?.label}
            </span>
          )}
          {leaderboard?.position === 1 && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 uppercase">
              🏆 Новый рекорд
            </span>
          )}
        </div>

        <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">
          {summary.rank}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Итоговое звание по результатам смены
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Очки" value={summary.score} />
          <Stat label="Длительность" value={formatDuration(summary.durationSec)} />
          <Stat label="Отработано" value={summary.eventsHandled} />
          <Stat label="Пропущено" value={summary.eventsMissed} />
        </div>

        <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-zinc-300 uppercase">
          Достижения ({unlockedAchievementIds.length}/{ACHIEVEMENT_LIST.length})
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACHIEVEMENT_LIST.map((a) => {
            const unlocked = unlockedSet.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                  unlocked
                    ? "border-amber-400/40 bg-amber-400/10"
                    : "border-zinc-800 bg-zinc-900/40 opacity-50"
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {unlocked ? a.emoji : "🔒"}
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold ${unlocked ? "text-amber-300" : "text-zinc-400"}`}
                  >
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    {a.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard && leaderboard.entries.length > 0 && (
          <>
            <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-zinc-300 uppercase">
              Рейтинг лучших смен на этом компьютере
            </h2>
            <ol className="flex flex-col gap-1.5">
              {leaderboard.entries.map((entry, i) => {
                const isCurrent = leaderboard.position === i + 1;
                return (
                  <li
                    key={`${entry.dateIso}-${i}`}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 text-xs ${
                      isCurrent
                        ? "border-cyan-400/50 bg-cyan-400/10"
                        : "border-zinc-800 bg-zinc-900/40"
                    }`}
                  >
                    <span className="w-4 shrink-0 text-center font-mono text-zinc-500">
                      {i + 1}
                    </span>
                    <span className="w-12 shrink-0 font-mono font-semibold text-zinc-100">
                      {entry.score}
                    </span>
                    <span className="flex-1 truncate text-zinc-400">
                      {entry.rank}
                      {entry.failedByMeltdown ? " · авария" : ""}
                      {" · "}
                      {difficultyLabel(entry)}
                    </span>
                    <span className="shrink-0 text-zinc-600">
                      {formatEntryDate(entry.dateIso)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mt-8 w-full rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 active:scale-[0.99]"
        >
          Начать заново
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
      <p className="font-mono text-xl font-semibold text-zinc-50">{value}</p>
      <p className="mt-0.5 text-[11px] tracking-wide text-zinc-500 uppercase">
        {label}
      </p>
    </div>
  );
}
