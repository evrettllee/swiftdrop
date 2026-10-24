import type { Clock } from '@/shared/lib/clock';
import { msUntilMinuteChange } from '../lib/minutes';

export function startMinuteTicks(
  clock: Clock,
  anchorMs: number,
  onTick: (nowMs: number) => void,
): () => void {
  let timer = 0;

  function schedule(): void {
    timer = clock.setTimeout(
      () => {
        onTick(clock.now());
        schedule();
      },
      msUntilMinuteChange(anchorMs, clock.now()),
    );
  }

  schedule();

  return () => clock.clearTimeout(timer);
}
