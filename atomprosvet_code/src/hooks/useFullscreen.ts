import { useCallback, useEffect, useState } from "react";

/** Переключение полноэкранного режима всей страницы — для показа на проекторе. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => document.fullscreenElement != null,
  );

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        // Браузер может отклонить запрос (например, без явного жеста
        // пользователя) — тихо игнорируем, кнопка просто не сработает.
      });
    }
  }, []);

  return { isFullscreen, toggle };
}
