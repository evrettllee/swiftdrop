import { useCallback, useState } from 'react';
import type { AdminTariff } from '../api/admin-tariffs';
import type { TariffField } from '../config/limits';
import { draftOf, type TariffDraft, type TariffErrors } from '../lib/tariff-form';

export const NEW_TARIFF = 'new';

export type EditTarget = number | typeof NEW_TARIFF;

export type Session = { target: EditTarget; draft: TariffDraft; errors: TariffErrors };

function withField(current: Session | null, field: TariffField, value: string): Session | null {
  if (current === null) {
    return null;
  }

  const { [field]: removed, ...errors } = current.errors;

  return removed === undefined && current.draft[field] === value
    ? current
    : { ...current, draft: { ...current.draft, [field]: value }, errors };
}

export function useEditSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);

  const startEdit = useCallback(
    (tariff: AdminTariff) =>
      setSession({ target: tariff.tariffId, draft: draftOf(tariff), errors: {} }),
    [],
  );
  const startNew = useCallback(
    () => setSession({ target: NEW_TARIFF, draft: draftOf(null), errors: {} }),
    [],
  );
  const change = useCallback(
    (field: TariffField, value: string) =>
      setSession((current) => withField(current, field, value)),
    [],
  );
  const clearFocus = useCallback(() => setFocusId(null), []);

  function cancel(): void {
    if (session !== null && session.target !== NEW_TARIFF) {
      setFocusId(session.target);
    }

    setSession(null);
  }

  return {
    session,
    setSession,
    focusId,
    setFocusId,
    startEdit,
    startNew,
    change,
    clearFocus,
    cancel,
  };
}
