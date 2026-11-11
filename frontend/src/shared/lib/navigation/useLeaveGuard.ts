import { useCallback, useEffect, useRef } from 'react';
import { type BlockerFunction, useBlocker } from 'react-router';

const BEFORE_UNLOAD = 'beforeunload';

export function useLeaveGuard(isDirty: boolean) {
  const isReleased = useRef(false);
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isReleased.current && currentLocation.pathname !== nextLocation.pathname,
    [isDirty],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    function warn(event: BeforeUnloadEvent): void {
      if (!isReleased.current) {
        event.preventDefault();
      }
    }

    window.addEventListener(BEFORE_UNLOAD, warn);

    return () => window.removeEventListener(BEFORE_UNLOAD, warn);
  }, [isDirty]);

  return {
    isBlocked: blocker.state === 'blocked',
    leave: () => blocker.proceed?.(),
    stay: () => blocker.reset?.(),
    release: () => {
      isReleased.current = true;
    },
  };
}
