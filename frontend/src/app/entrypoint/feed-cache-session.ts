import { clearFeedCaches } from '@/shared/lib/list-feed';
import { useAuthStore } from '@/shared/session';
import { isSessionOwnerChanged } from './session-owner';

export function bindFeedCachesToSession(): () => void {
  return useAuthStore.subscribe((state, previous) => {
    if (isSessionOwnerChanged(previous, state)) {
      clearFeedCaches();
    }
  });
}
