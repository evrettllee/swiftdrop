import { ChatsCircleIcon } from '@phosphor-icons/react';
import { useParams } from 'react-router';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { SUPPORT_TICKET_PARAM } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Spinner } from '@/shared/ui/spinner';
import { THREAD_TEXTS } from '../config/thread-texts';
import { parseIdParam } from '../lib/new-ticket';
import { useMyTicket } from '../model/useMyTicket';
import { type SupportRole, useSupportRole } from '../model/useSupportRole';
import { TicketDesktop } from './TicketDesktop';
import { TicketScreen } from './TicketScreen';

function NotFound({ role }: { role: SupportRole }) {
  return (
    <EmptyState
      icon={ChatsCircleIcon}
      title={THREAD_TEXTS.NOT_FOUND}
      text={THREAD_TEXTS.NOT_FOUND_TEXT}
    >
      <LinkButton variant="secondary" to={role.supportPath}>
        {THREAD_TEXTS.TO_LIST}
      </LinkButton>
    </EmptyState>
  );
}

function TicketView({ ticketId, role }: { ticketId: number; role: SupportRole }) {
  const model = useMyTicket(ticketId);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { details, ticket } = model;

  if (details.isMissing) {
    return <NotFound role={role} />;
  }

  if (ticket === null && details.message !== null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <InlineAlert variant="error" title={details.message} />
        <Button variant="secondary" onClick={details.reload}>
          {THREAD_TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  if (ticket === null) {
    return (
      <div className="grid flex-1 place-items-center">
        <Spinner />
      </div>
    );
  }

  return isDesktop ? (
    <TicketDesktop model={model} ticket={ticket} role={role} />
  ) : (
    <TicketScreen model={model} ticket={ticket} role={role} />
  );
}

export function SupportTicketPage() {
  const params = useParams();
  const role = useSupportRole();
  const ticketId = parseIdParam(params[SUPPORT_TICKET_PARAM] ?? null);

  return ticketId === null ? (
    <NotFound role={role} />
  ) : (
    <TicketView key={ticketId} ticketId={ticketId} role={role} />
  );
}
