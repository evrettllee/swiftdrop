import { useState } from 'react';
import { getApiErrorMessage } from '@/shared/api';
import {
  CREATE_TICKET_FAILURE,
  createMyTicket,
  createTicketFailureOf,
  SUPPORT_TOPIC,
  type SupportTopic,
} from '@/shared/support-api';
import { NEW_TICKET_TEXTS } from '../config/new-ticket';
import {
  type NewTicketDraft,
  type NewTicketErrors,
  type NewTicketField,
  toNewTicket,
  validateDraft,
} from '../lib/new-ticket';

type NewTicketOptions = {
  initialOrderId: number | null;
  onCreated: (ticketId: number) => void;
  onAlreadyOpen: (ticketId: number) => void;
};

const FIELDS: readonly NewTicketField[] = ['subject', 'message'];

function isField(name: string): name is NewTicketField {
  return FIELDS.some((field) => field === name);
}

type FailureOutcome =
  | { openTicketId: number }
  | { openTicketId: null; errors: NewTicketErrors; formError: string | null };

function outcomeOf(error: unknown): FailureOutcome {
  const failure = createTicketFailureOf(error);
  const fail = (formError: string | null, errors: NewTicketErrors = {}): FailureOutcome => ({
    openTicketId: null,
    errors,
    formError,
  });

  if (failure.kind === CREATE_TICKET_FAILURE.ALREADY_OPEN) {
    return failure.ticketId === null
      ? fail(NEW_TICKET_TEXTS.ALREADY_OPEN)
      : { openTicketId: failure.ticketId };
  }

  if (failure.kind === CREATE_TICKET_FAILURE.TOO_MANY) {
    return fail(NEW_TICKET_TEXTS.TOO_MANY);
  }

  if (failure.kind === CREATE_TICKET_FAILURE.INVALID) {
    const errors: NewTicketErrors = {};
    FIELDS.forEach((field) => {
      errors[field] = failure.fields[field];
    });
    const hasFieldError = FIELDS.some((field) => errors[field] !== undefined);

    return fail(hasFieldError ? null : failure.message, errors);
  }

  return fail(getApiErrorMessage(failure.error, NEW_TICKET_TEXTS.FAILED));
}

function withoutFields(errors: NewTicketErrors, patch: Partial<NewTicketDraft>): NewTicketErrors {
  const next = { ...errors };

  for (const key of Object.keys(patch)) {
    if (isField(key)) {
      delete next[key];
    }
  }

  return next;
}

export function useNewTicket({ initialOrderId, onCreated, onAlreadyOpen }: NewTicketOptions) {
  const [draft, setDraft] = useState<NewTicketDraft>({
    topic: SUPPORT_TOPIC.ORDER_PROBLEM,
    subject: '',
    orderId: initialOrderId,
    message: '',
  });
  const [errors, setErrors] = useState<NewTicketErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  function change(patch: Partial<NewTicketDraft>): void {
    setDraft((value) => ({ ...value, ...patch }));
    setErrors((value) => withoutFields(value, patch));
  }

  async function submit(): Promise<void> {
    const found = validateDraft(draft);
    setErrors(found);
    setFormError(null);

    if (Object.keys(found).length > 0 || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const ticket = await createMyTicket(toNewTicket(draft));
      onCreated(ticket.id);
    } catch (error) {
      const outcome = outcomeOf(error);

      if (outcome.openTicketId === null) {
        setErrors(outcome.errors);
        setFormError(outcome.formError);
      } else {
        onAlreadyOpen(outcome.openTicketId);
      }
    } finally {
      setIsSending(false);
    }
  }

  return {
    draft,
    errors,
    formError,
    isSending,
    setTopic: (topic: SupportTopic) => change({ topic }),
    setSubject: (subject: string) => change({ subject }),
    setOrderId: (orderId: number | null) => change({ orderId }),
    setMessage: (message: string) => change({ message }),
    submit: () => void submit(),
  };
}

export type NewTicketModel = ReturnType<typeof useNewTicket>;
