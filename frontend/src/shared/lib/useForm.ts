import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { z } from 'zod';
import { ApiError } from '../api/http';
import { API_ERROR_MESSAGES, CHECKBOX_CHECKED_VALUE, CHECKBOX_UNCHECKED_VALUE } from '../constants';
import { collectFieldErrors, focusFirstInvalid } from './forms';

type FormValues = Record<string, string>;

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
  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsed = schema.safeParse(values);
  const clientErrors: Record<string, string> = parsed.success
    ? {}
    : collectFieldErrors(parsed.error.issues);

  function getError(name: string): string | undefined {
    return serverErrors[name] ?? (touched[name] ? clientErrors[name] : undefined);
  }

  function setValue(name: string, value: string): void {
    setValues((current) => ({ ...current, [name]: value }));
    setServerErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)),
    );
  }

  function markTouched(name: string): void {
    setTouched((current) => ({ ...current, [name]: true }));
  }

  function field(name: string) {
    return {
      name,
      value: values[name] ?? '',
      error: getError(name),
      onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
      onBlur: () => markTouched(name),
    };
  }

  function checkbox(name: string) {
    return {
      name,
      checked: values[name] === CHECKBOX_CHECKED_VALUE,
      error: getError(name),
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setValue(name, event.target.checked ? CHECKBOX_CHECKED_VALUE : CHECKBOX_UNCHECKED_VALUE);
        markTouched(name);
      },
    };
  }

  async function submitValid(data: z.output<TSchema>): Promise<void> {
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
        setFormError(error instanceof ApiError ? error.message : API_ERROR_MESSAGES.GENERIC);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormError(null);
    setTouched(Object.fromEntries(Object.keys(values).map((name) => [name, true])));

    if (!isSubmitting) {
      if (parsed.success) {
        void submitValid(parsed.data);
      } else {
        requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      }
    }
  }

  return { formRef, values, field, checkbox, formError, isSubmitting, handleSubmit };
}
