import type { Clock } from '@/shared/lib/clock';

export type ToastTimer = {
  start: (durationMs: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
};

export function createToastTimer(clock: Clock, onEnd: () => void): ToastTimer {
  let timer: number | null = null;
  let remainingMs = 0;
  let startedAtMs = 0;
  let isPaused = false;

  function clear(): void {
    if (timer !== null) {
      clock.clearTimeout(timer);
      timer = null;
    }
  }

  function run(): void {
    startedAtMs = clock.now();
    timer = clock.setTimeout(onEnd, remainingMs);
  }

  return {
    start: (durationMs) => {
      clear();
      isPaused = false;
      remainingMs = durationMs;
      run();
    },
    stop: () => {
      clear();
      isPaused = false;
    },
    pause: () => {
      if (timer === null || isPaused) {
        return;
      }

      isPaused = true;
      clear();
      remainingMs = Math.max(remainingMs - (clock.now() - startedAtMs), 0);
    },
    resume: () => {
      if (!isPaused) {
        return;
      }

      isPaused = false;
      run();
    },
  };
}
