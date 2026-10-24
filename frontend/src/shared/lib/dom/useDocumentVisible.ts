import { useSyncExternalStore } from 'react';
import { DOM_EVENT } from '@/shared/config';

function subscribe(onStoreChange: () => void): () => void {
  document.addEventListener(DOM_EVENT.VISIBILITY_CHANGE, onStoreChange);

  return () => document.removeEventListener(DOM_EVENT.VISIBILITY_CHANGE, onStoreChange);
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, () => !document.hidden);
}
