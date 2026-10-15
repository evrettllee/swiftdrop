import { useEffect } from 'react';
import { SCROLL_LOCK_OVERFLOW } from '@/shared/config';

// The page under a dialog or the expanded map does not scroll while `isLocked`.
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = SCROLL_LOCK_OVERFLOW;

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
}
