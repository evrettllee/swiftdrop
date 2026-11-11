import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

const KEY_STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export function useBarFocus(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const [focused, setFocused] = useState(0);
  const bars = useRef<(HTMLElement | null)[]>([]);
  const current = Math.min(focused, Math.max(0, count - 1));

  const move = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), count - 1);
      setFocused(next);
      bars.current[next]?.focus();
    },
    [count],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const step = KEY_STEP[event.key] as number | undefined;
    let next: number | null = step === undefined ? null : current + step;

    if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = count - 1;
    }

    if (next !== null) {
      event.preventDefault();
      move(next);
    }
  };

  const barProps = (index: number) => ({
    ref: (element: HTMLElement | null) => {
      bars.current[index] = element;
    },
    tabIndex: index === current ? 0 : -1,
    onFocus: () => {
      setFocused(index);
      setActive(index);
    },
    onBlur: () => setActive(null),
    onMouseEnter: () => setActive(index),
    onMouseLeave: () => setActive(null),
  });

  return { active: active !== null && active < count ? active : null, onKeyDown, barProps };
}
