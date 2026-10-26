import { type FocusEvent, useSyncExternalStore } from 'react';
import { useEscapeKey } from '@/shared/lib/dom';
import { Toast } from './Toast';
import { toastStore } from './toast-store';

const POSITION_CLASS =
  'bottom-[calc(5rem+env(safe-area-inset-bottom))] [body:has([data-action-bar])_&]:bottom-[calc(9.25rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:end-8 lg:w-100 lg:bottom-8 lg:[body:has([data-action-bar])_&]:bottom-8';

function handleBlur(event: FocusEvent<HTMLDivElement>): void {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    toastStore.resume();
  }
}

export function ToastViewport() {
  const toast = useSyncExternalStore(toastStore.subscribe, toastStore.getToast);

  useEscapeKey(() => toastStore.hide(), toast !== null);

  return (
    <div role="status" className={`pointer-events-none fixed inset-x-4 z-40 ${POSITION_CLASS}`}>
      {toast === null ? null : (
        <div
          key={toast.id}
          className="pointer-events-auto"
          onPointerEnter={toastStore.pause}
          onPointerLeave={toastStore.resume}
          onFocus={toastStore.pause}
          onBlur={handleBlur}
        >
          <Toast
            variant={toast.variant}
            title={toast.title}
            text={toast.text}
            action={toast.action}
            onClose={() => toastStore.hide()}
          />
        </div>
      )}
    </div>
  );
}
