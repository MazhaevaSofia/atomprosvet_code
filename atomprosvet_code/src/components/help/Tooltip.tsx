import { useState, type ReactNode } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
  /** Доступное имя кнопки-обёртки для скринридеров. Без него оно не всегда
   *  надёжно вычисляется из вложенного содержимого (например, из svg с
   *  role="img") — на практике браузер может отдать пустое имя. */
  ariaLabel?: string;
}

/**
 * Короткая подсказка (1-2 предложения) при наведении или нажатии на элемент.
 * Нажатие нужно для сенсорных экранов, где наведения не существует.
 */
export function Tooltip({ text, children, ariaLabel }: TooltipProps) {
  // hovering и clicked раздельны, чтобы клик по уже наведённому элементу
  // (десктоп) не гасил только что открывшуюся по hover подсказку — видимость
  // это "или", а mouseleave сбрасывает оба флага разом.
  const [hovering, setHovering] = useState(false);
  const [clicked, setClicked] = useState(false);
  const open = hovering || clicked;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setClicked(false);
      }}
    >
      <button
        type="button"
        onClick={() => setClicked((c) => !c)}
        className="block w-full cursor-help text-left"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {children}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute inset-x-2 top-full z-30 mt-2 rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-xs leading-relaxed text-zinc-200 shadow-xl"
        >
          {text}
        </div>
      )}
    </div>
  );
}
