import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { Dashboard } from "./components/dashboard/Dashboard";
import { EventToastStack } from "./components/dashboard/EventToastStack";
import { FactsScreen } from "./components/facts/FactsScreen";
import { GuideScreen } from "./components/guide/GuideScreen";
import { HelpPanel } from "./components/help/HelpPanel";
import { StartScreen } from "./components/start/StartScreen";
import { SummaryScreen } from "./components/summary/SummaryScreen";
import { AchievementToastStack } from "./components/achievements/AchievementToastStack";
import { useSimulationLoop } from "./hooks/useSimulationLoop";
import { useEventToasts } from "./hooks/useEventToasts";
import { useAchievementToasts } from "./hooks/useAchievementToasts";
import { useGameStore } from "./store/useGameStore";
import type { Difficulty } from "./engine/types";

type Screen = "start" | "dashboard" | "facts" | "guide" | "summary";

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [helpOpen, setHelpOpen] = useState(false);
  // Куда вернуться из гайда — его можно открыть и со старта, и с пульта.
  const [guideReturnTo, setGuideReturnTo] = useState<"start" | "dashboard">(
    "start",
  );

  const state = useGameStore((s) => s.state);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const reset = useGameStore((s) => s.reset);

  // Цикл симуляции живёт на уровне приложения, а не экрана: игровое время
  // продолжает идти, даже когда открыт экран «Факты» или панель «Справка»
  // (и сам останавливается движком, когда смена завершена) — но не должно
  // идти, пока пользователь ещё смотрит стартовый экран.
  useSimulationLoop(screen !== "start");

  // Как только смена завершилась (аварией или штатно) — показываем итоги,
  // с какого бы экрана это ни произошло. Выводится прямо из состояния смены,
  // а не через useEffect+setState, чтобы не плодить лишний рендер.
  const shiftOver = state.isMeltdown || state.isShiftComplete;
  const displayScreen: Screen =
    shiftOver && screen !== "start" ? "summary" : screen;

  const { toasts: eventToasts, dismiss: dismissEvent } = useEventToasts(
    state.activeEvents,
  );
  const { toasts: achievementToasts, dismiss: dismissAchievement } =
    useAchievementToasts(unlockedAchievements);

  const startShift = (demo: boolean, difficulty: Difficulty) => {
    reset({ demo, difficulty });
    setScreen("dashboard");
  };

  // После итогов — обратно на стартовый экран, чтобы снова выбрать обычную
  // смену или демо-сценарий, а не молча повторить прошлый режим.
  const restart = () => setScreen("start");

  const openGuide = (from: "start" | "dashboard") => {
    setGuideReturnTo(from);
    setScreen("guide");
  };

  return (
    // reducedMotion="user" — все анимации Framer Motion в приложении сами
    // уважают системную настройку "Уменьшить движение" (prefers-reduced-motion).
    <MotionConfig reducedMotion="user">
      {displayScreen === "start" ? (
        <StartScreen onStart={startShift} onOpenGuide={() => openGuide("start")} />
      ) : displayScreen === "summary" ? (
        <SummaryScreen
          state={state}
          unlockedAchievementIds={unlockedAchievements}
          onRestart={restart}
        />
      ) : displayScreen === "facts" ? (
        <FactsScreen onBack={() => setScreen("dashboard")} />
      ) : displayScreen === "guide" ? (
        <GuideScreen
          onClose={() => setScreen(guideReturnTo)}
          closeLabel={
            guideReturnTo === "dashboard" ? "← Назад к пульту" : "← Назад"
          }
        />
      ) : (
        <Dashboard
          onOpenFacts={() => setScreen("facts")}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenGuide={() => openGuide("dashboard")}
        />
      )}

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      <EventToastStack toasts={eventToasts} onDismiss={dismissEvent} />
      <AchievementToastStack
        toasts={achievementToasts}
        onDismiss={dismissAchievement}
      />
    </MotionConfig>
  );
}

export default App;
