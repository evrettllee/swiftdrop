import { useSearchParams } from 'react-router';
import { SUPPORT_NEW_PARAM, SUPPORT_NEW_VALUE, SUPPORT_ORDER_PARAM } from '@/shared/routes';
import { SUPPORT_TICKET_STATUS, type SupportTicketStatus } from '@/shared/staff-api';
import { parseIdParam } from '../lib/new-ticket';

const STATUS_PARAM = 'status';

export function useSupportParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status: SupportTicketStatus =
    searchParams.get(STATUS_PARAM) === SUPPORT_TICKET_STATUS.CLOSED
      ? SUPPORT_TICKET_STATUS.CLOSED
      : SUPPORT_TICKET_STATUS.OPEN;
  const isNewOpen = searchParams.get(SUPPORT_NEW_PARAM) === SUPPORT_NEW_VALUE;
  const orderId = parseIdParam(searchParams.get(SUPPORT_ORDER_PARAM));

  function update(change: (next: URLSearchParams) => void, replace: boolean): void {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        change(next);

        return next;
      },
      { replace },
    );
  }

  return {
    status,
    isNewOpen,
    orderId,
    setStatus: (value: SupportTicketStatus) =>
      update((next) => {
        if (value === SUPPORT_TICKET_STATUS.CLOSED) {
          next.set(STATUS_PARAM, value);
        } else {
          next.delete(STATUS_PARAM);
        }
      }, true),
    openNew: () => update((next) => next.set(SUPPORT_NEW_PARAM, SUPPORT_NEW_VALUE), false),
    closeNew: () =>
      update((next) => {
        next.delete(SUPPORT_NEW_PARAM);
        next.delete(SUPPORT_ORDER_PARAM);
      }, true),
  };
}
