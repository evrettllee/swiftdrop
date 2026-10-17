import { type RefObject, useState } from 'react';
import { API_ERROR_MESSAGES, ApiError, getApiErrorMessage } from '@/shared/api';
import { focusFirstInvalid } from './field-errors';
import type { FieldErrors } from './useFieldState';

// Sends valid data. Errors of single fields from the backend go under their fields (the focus
// moves to the first of them); any other error becomes the error of the whole form.
export function useFormSubmit<TData>(
  onSubmit: (data: TData) => Promise<void>,
  formRef: RefObject<HTMLFormElement | null>,
  setServerErrors: (errors: FieldErrors) => void,
) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitValid(data: TData): Promise<void> {
    setIsSubmitting(true);

    try {
      await onSubmit(data);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        setServerErrors(
          Object.fromEntries(error.fieldErrors.map((item) => [item.field, item.message])),
        );
        requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      } else {
        setFormError(getApiErrorMessage(error, API_ERROR_MESSAGES.GENERIC));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { formError, setFormError, isSubmitting, submitValid };
}
