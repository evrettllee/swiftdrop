import { useState } from 'react';
import { INVALID_FIELD_SELECTOR } from '@/shared/config';
import { showToast } from '@/shared/ui/toast';
import {
  type AdminTariff,
  createTariff,
  type TariffValues,
  updateTariff,
} from '../api/admin-tariffs';
import { fieldErrorsOf, saveError } from '../lib/server-errors';
import { changedFields, type TariffErrors, validateDraft } from '../lib/tariff-form';
import { type EditTarget, NEW_TARIFF, type Session, useEditSession } from './useEditSession';

export { NEW_TARIFF };

const TOAST_KEY = 'tariff-save';

function focusFirstInvalid(): void {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(INVALID_FIELD_SELECTOR)?.focus();
  });
}

async function send(
  target: EditTarget,
  values: TariffValues,
  items: readonly AdminTariff[],
): Promise<AdminTariff | null> {
  if (target === NEW_TARIFF) {
    return createTariff(values);
  }

  const current = items.find((item) => item.tariffId === target);
  const changes = current === undefined ? values : changedFields(current, values);

  return Object.keys(changes).length === 0 ? null : updateTariff(target, changes);
}

type Outcome = { errors: TariffErrors } | { errors: null; saved: AdminTariff | null };

async function persist(session: Session, items: readonly AdminTariff[]): Promise<Outcome> {
  const { values, errors } = validateDraft(session.draft);

  if (values === null) {
    return { errors };
  }

  return { errors: null, saved: await send(session.target, values, items) };
}

type EditOptions = {
  items: readonly AdminTariff[];
  onCreated: (tariff: AdminTariff) => void;
  onSaved: (tariff: AdminTariff) => void;
};

export function useTariffEdit({ items, onCreated, onSaved }: EditOptions) {
  const editing = useEditSession();
  const { session, setSession, setFocusId } = editing;
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (session === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const outcome = await persist(session, items);

      if (outcome.errors === null) {
        const { saved } = outcome;

        if (saved !== null) {
          (session.target === NEW_TARIFF ? onCreated : onSaved)(saved);
        }

        setFocusId(saved?.tariffId ?? (session.target === NEW_TARIFF ? null : session.target));
        setSession(null);
      } else {
        setSession({ ...session, errors: outcome.errors });
        focusFirstInvalid();
      }
    } catch (error) {
      const fieldErrors = fieldErrorsOf(error);

      if (fieldErrors === null) {
        showToast({ key: TOAST_KEY, variant: 'error', ...saveError(error) });
      } else {
        setSession({ ...session, errors: fieldErrors });
        focusFirstInvalid();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    target: session?.target ?? null,
    draft: session?.draft ?? null,
    errors: session?.errors ?? {},
    isSubmitting,
    submit,
    startEdit: editing.startEdit,
    startNew: editing.startNew,
    cancel: editing.cancel,
    change: editing.change,
    focusId: editing.focusId,
    clearFocus: editing.clearFocus,
  };
}

export type TariffEdit = ReturnType<typeof useTariffEdit>;
