import { useFullscreen } from "../../hooks/useFullscreen";

interface FullscreenButtonProps {
  className?: string;
}

/** Кнопка полноэкранного режима — для показа пульта на проекторе. */
export function FullscreenButton({ className = "" }: FullscreenButtonProps) {
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <button
      type="button"
      onClick={toggle}
      title={isFullscreen ? "Выйти из полноэкранного режима" : "Во весь экран"}
      aria-label={
        isFullscreen ? "Выйти из полноэкранного режима" : "Во весь экран"
      }
      className={`rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-700 active:scale-95 ${className}`}
    >
      {isFullscreen ? "⤢ Свернуть" : "⛶ Во весь экран"}
    </button>
  );
}
