import { MS_PER_SECOND } from '@/shared/config';
import { type Clock, PAGE_CLOCK } from '@/shared/lib/clock';
import { createToastTimer } from './toast-timer';

export const TOAST_DURATION_MS = 6 * MS_PER_SECOND;

export type ToastVariant = 'info' | 'warning' | 'chat';

export type ToastAction = {
  label: string;
  onAction: () => void;
};

export type ToastContent = {
  key: string;
  variant: ToastVariant;
  title: string;
  text: string;
  action?: ToastAction;
  durationMs?: number;
};

export type ShownToast = ToastContent & { id: number };

export type ToastStore = {
  getToast: () => ShownToast | null;
  subscribe: (listener: () => void) => () => void;
  show: (content: ToastContent) => void;
  hide: (key?: string) => void;
  pause: () => void;
  resume: () => void;
};

export function createToastStore(clock: Clock): ToastStore {
  const listeners = new Set<() => void>();
  let toast: ShownToast | null = null;
  let nextId = 1;

  const timer = createToastTimer(clock, () => hide());

  function emit(): void {
    listeners.forEach((listener) => listener());
  }

  function hide(key?: string): void {
    if (toast === null || (key !== undefined && toast.key !== key)) {
      return;
    }

    timer.stop();
    toast = null;
    emit();
  }

  return {
    getToast: () => toast,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    show: (content) => {
      toast = { ...content, id: nextId };
      nextId += 1;
      timer.start(content.durationMs ?? TOAST_DURATION_MS);
      emit();
    },
    hide,
    pause: timer.pause,
    resume: timer.resume,
  };
}

export const toastStore = createToastStore(PAGE_CLOCK);

export const showToast = toastStore.show;
export const hideToast = toastStore.hide;
