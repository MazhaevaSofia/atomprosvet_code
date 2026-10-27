/**
 * Простой звуковой сигнал тревоги на Web Audio API — без внешних аудиофайлов.
 * Два коротких бипа на разной высоте, похоже на сигнал пульта.
 */
export function playAlarmBeep(): void {
  try {
    const AudioContextCtor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    const beep = (startAt: number, frequency: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + startAt);
      gain.gain.exponentialRampToValueAtTime(0.12, now + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startAt);
      osc.stop(now + startAt + duration);
    };

    beep(0, 880, 0.15);
    beep(0.18, 660, 0.18);

    window.setTimeout(() => ctx.close(), 600);
  } catch {
    // Web Audio недоступен или заблокирован политикой автовоспроизведения —
    // визуальное уведомление всё равно сработает, звук просто пропускаем.
  }
}
