import { INVALID_FIELD_SELECTOR } from '@/shared/config';

type Issue = { path: PropertyKey[]; message: string };

// Keeps the first message for each field.
export function collectFieldErrors(issues: ReadonlyArray<Issue>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const field = String(issue.path[0] ?? '');

    if (field !== '' && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

export function focusFirstInvalid(form: HTMLFormElement | null): void {
  form?.querySelector<HTMLElement>(INVALID_FIELD_SELECTOR)?.focus();
}
