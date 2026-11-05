import { TICKET_STATE_DOTS, TICKET_STATE_LABELS, type TicketState } from '../config/texts';

export function TicketStateMark({ state }: { state: TicketState }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-small whitespace-nowrap">
      <span aria-hidden="true" className={`size-2.5 rounded-full ${TICKET_STATE_DOTS[state]}`} />
      {TICKET_STATE_LABELS[state]}
    </span>
  );
}
