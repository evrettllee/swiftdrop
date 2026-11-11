import { useState } from 'react';
import { type ToastContent, showToast } from '@/shared/ui/toast';
import { FAILURE_KIND } from '../lib/action-failure';
import { useActionSubmit } from './useActionSubmit';

type ReasonActionOptions<T> = {
  run: (reasonText: string) => Promise<T>;
  toastOf: (value: T) => Omit<ToastContent, 'key' | 'variant'>;
  toastKey: string;
  onClose: () => void;
  onChanged: () => void;
};

export function useReasonAction<T>({
  run,
  toastOf,
  toastKey,
  onClose,
  onChanged,
}: ReasonActionOptions<T>) {
  const action = useActionSubmit();
  const [reasonText, setReasonText] = useState('');

  async function submit(): Promise<void> {
    const result = await action.submit(() => run(reasonText));

    if (result.ok) {
      showToast({ key: toastKey, variant: 'success', ...toastOf(result.value) });
      onClose();
      onChanged();
    } else if (result.failure?.kind === FAILURE_KIND.CONFLICT) {
      onChanged();
    }
  }

  function refresh(): void {
    onClose();
    onChanged();
  }

  return {
    action,
    reasonText,
    setReasonText,
    fieldError: action.failure?.kind === FAILURE_KIND.FIELD ? action.failure.title : undefined,
    submit,
    refresh,
  };
}
