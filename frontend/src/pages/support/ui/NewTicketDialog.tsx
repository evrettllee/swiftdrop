import { useId } from 'react';
import { useLoad } from '@/shared/lib/async';
import { SUPPORT_MESSAGE_MAX_LENGTH, SUPPORT_SUBJECT_MAX_LENGTH } from '@/shared/support-api';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { FieldError } from '@/shared/ui/field-error';
import { Input } from '@/shared/ui/input';
import { TextArea } from '@/shared/ui/textarea';
import { getRecentOrders } from '../api/recent-orders';
import { NEW_TICKET_TEXTS } from '../config/new-ticket';
import { needsSubject } from '../lib/new-ticket';
import { useNewTicket } from '../model/useNewTicket';
import type { SupportRole } from '../model/useSupportRole';
import { OrderField } from './OrderField';
import { TopicField } from './TopicField';

type NewTicketDialogProps = {
  role: SupportRole;
  initialOrderId: number | null;
  onClose: () => void;
  onCreated: (ticketId: number) => void;
  onAlreadyOpen: (ticketId: number) => void;
};

export function NewTicketDialog({ role, initialOrderId, ...events }: NewTicketDialogProps) {
  const formId = useId();
  const model = useNewTicket({ initialOrderId, ...events });
  const orders = useLoad(
    `orders:${role.role}`,
    (signal) => getRecentOrders(role.role, { signal }),
    NEW_TICKET_TEXTS.FAILED,
  );
  const { draft, errors } = model;

  return (
    <Dialog
      isOpen
      width="large"
      isBodyScrolling
      hasDividers
      onClose={events.onClose}
      title={NEW_TICKET_TEXTS.TITLE}
      actions={
        <>
          <Button type="submit" form={formId} loading={model.isSending}>
            {NEW_TICKET_TEXTS.SEND}
          </Button>
          <Button variant="secondary" onClick={events.onClose}>
            {NEW_TICKET_TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          model.submit();
        }}
        className="flex flex-col gap-4 text-fg"
      >
        <TopicField topics={role.topics} value={draft.topic} onChange={model.setTopic} />
        {needsSubject(draft.topic) ? (
          <Input
            label={NEW_TICKET_TEXTS.SUBJECT}
            placeholder={NEW_TICKET_TEXTS.SUBJECT_PLACEHOLDER}
            value={draft.subject}
            maxLength={SUPPORT_SUBJECT_MAX_LENGTH}
            error={errors.subject}
            onChange={(event) => model.setSubject(event.target.value)}
          />
        ) : null}
        <OrderField orders={orders.data ?? []} value={draft.orderId} onChange={model.setOrderId} />
        <TextArea
          label={NEW_TICKET_TEXTS.MESSAGE}
          placeholder={NEW_TICKET_TEXTS.MESSAGE_PLACEHOLDER}
          value={draft.message}
          maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
          error={errors.message}
          counterLabel={NEW_TICKET_TEXTS.counter}
          onChange={(event) => model.setMessage(event.target.value)}
        />
        {model.formError === null ? null : (
          <div role="alert">
            <FieldError id={`${formId}-error`}>{model.formError}</FieldError>
          </div>
        )}
      </form>
    </Dialog>
  );
}
