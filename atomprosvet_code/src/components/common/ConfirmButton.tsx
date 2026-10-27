import { useEffect, useState } from "react";

interface ConfirmButtonProps {
  label: string;
  /** Что показать после первого нажатия, пока ждём подтверждения. */
  confirmLabel: string;
  onConfirm: () => void;
  /** Классы кнопки в обычном состоянии. */
  className?: string;
  /** Полный набор классов для «взведённого» состояния (если не задан, как у className). */
  confirmClassName?: string;
}

const CONFIRM_WINDOW_MS = 3000;

/**
 * Кнопка для действий, после которых прогресс смены пропадает: первое
 * нажатие только «взводит» её и просит подтвердить, второе в течение
 * нескольких секунд выполняет действие. Защищает от случайного клика.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = "",
  confirmClassName = "",
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={armed && confirmClassName ? confirmClassName : className}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
