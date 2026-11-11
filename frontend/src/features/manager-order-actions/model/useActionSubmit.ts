import { useCallback, useRef, useState } from 'react';
import { type ActionFailure, toActionFailure } from '../lib/action-failure';

export type SubmitResult<T> = { ok: true; value: T } | { ok: false; failure: ActionFailure | null };

export function useActionSubmit() {
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<ActionFailure | null>(null);

  const submit = useCallback(async <T>(work: () => Promise<T>): Promise<SubmitResult<T>> => {
    if (inFlight.current) {
      return { ok: false, failure: null };
    }

    inFlight.current = true;
    setIsSubmitting(true);
    setFailure(null);

    try {
      return { ok: true, value: await work() };
    } catch (error) {
      const next = toActionFailure(error);
      setFailure(next);

      return { ok: false, failure: next };
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => setFailure(null), []);

  return { isSubmitting, failure, submit, reset };
}
