import { type FormEvent, useRef } from 'react';
import type { z } from 'zod';
import { collectFieldErrors, focusFirstInvalid } from './field-errors';
import { type FormValues, useFieldState } from './useFieldState';
import { useFormSubmit } from './useFormSubmit';

type UseFormOptions<TSchema extends z.ZodType> = {
  initialValues: FormValues;
  schema: TSchema;
  onSubmit: (data: z.output<TSchema>) => Promise<void>;
};

// A small form helper: errors are derived from the schema and shown once a field was left or the
// form was submitted; errors from the backend replace them until the field is edited.
export function useForm<TSchema extends z.ZodType>({
  initialValues,
  schema,
  onSubmit,
}: UseFormOptions<TSchema>) {
  const formRef = useRef<HTMLFormElement>(null);
  const state = useFieldState(initialValues);
  const submission = useFormSubmit(onSubmit, formRef, state.setServerErrors);

  const parsed = schema.safeParse(state.values);
  const clientErrors: Record<string, string> = parsed.success
    ? {}
    : collectFieldErrors(parsed.error.issues);

  function getError(name: string): string | undefined {
    return state.serverErrors[name] ?? (state.touched[name] ? clientErrors[name] : undefined);
  }

  function field(name: string) {
    return state.bindInput(name, getError(name));
  }

  function checkbox(name: string) {
    return state.bindCheckbox(name, getError(name));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submission.setFormError(null);
    state.touchAll();

    if (!submission.isSubmitting) {
      if (parsed.success) {
        void submission.submitValid(parsed.data);
      } else {
        requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      }
    }
  }

  return {
    formRef,
    values: state.values,
    field,
    checkbox,
    formError: submission.formError,
    isSubmitting: submission.isSubmitting,
    handleSubmit,
  };
}
