import { type ChangeEvent, useState } from 'react';
import { CHECKBOX_CHECKED_VALUE, CHECKBOX_UNCHECKED_VALUE } from '@/shared/config';

export type FormValues = Record<string, string>;
export type FieldErrors = Record<string, string>;

// The values of the fields, the fields that were left, and the errors the backend gave for single
// fields: each of them is kept until its field is edited.
export function useFieldState(initialValues: FormValues) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  function setValue(name: string, value: string): void {
    setValues((current) => ({ ...current, [name]: value }));
    setServerErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)),
    );
  }

  function markTouched(name: string): void {
    setTouched((current) => ({ ...current, [name]: true }));
  }

  function touchAll(): void {
    setTouched(Object.fromEntries(Object.keys(values).map((name) => [name, true])));
  }

  function bindInput(name: string, error: string | undefined) {
    return {
      name,
      value: values[name] ?? '',
      error,
      onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
      onBlur: () => markTouched(name),
    };
  }

  function bindCheckbox(name: string, error: string | undefined) {
    return {
      name,
      checked: values[name] === CHECKBOX_CHECKED_VALUE,
      error,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setValue(name, event.target.checked ? CHECKBOX_CHECKED_VALUE : CHECKBOX_UNCHECKED_VALUE);
        markTouched(name);
      },
    };
  }

  return { values, touched, serverErrors, setServerErrors, touchAll, bindInput, bindCheckbox };
}
