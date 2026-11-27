import { useState } from 'react';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import { type ActionError, actionErrorOf } from '../lib/server-error';

export function useActionSubmit<T>(run: () => Promise<T>, onDone: (result: T) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  async function submit(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      onDone(await run());
    } catch (caught) {
      setError(actionErrorOf(caught, DIALOG_TEXTS.FAILED));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, submit, setError };
}
