import { useCallback, useState } from 'react';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { isValidOrderId, orderRequestKey } from '../lib/order-answer';
import { type OrderRequest, useOrderAnswer } from './useOrderAnswer';

// One order of the client. `reload` asks the server again (after a cancel or a payment) and keeps
// the shown order until the new answer comes. `refresh` asks the same way but quietly: when it
// fails nothing changes on the page and the next one tries again. A wrong id in the address is a
// missing order.
export function useOrderDetails(orderId: number) {
  const [request, setRequest] = useState<OrderRequest>({ attempt: 0, isSilent: false });
  const isValidId = isValidOrderId(orderId);
  const answer = useOrderAnswer(orderId, request, isValidId);

  // Stable, so effects that ask for the order do not restart on every render.
  const ask = useCallback(
    (isSilent: boolean) => setRequest((current) => ({ attempt: current.attempt + 1, isSilent })),
    [],
  );
  const reload = useCallback(() => ask(false), [ask]);
  const refresh = useCallback(() => ask(true), [ask]);

  const isSameOrder = answer.orderId === orderId;
  const isAnswered = isSameOrder && answer.key === orderRequestKey(orderId, request.attempt);
  let status: ListStatus = LIST_STATUS.LOADING;

  if (!isValidId) {
    status = LIST_STATUS.ERROR;
  } else if (isAnswered) {
    status = answer.status;
  }

  return {
    status,
    order: isSameOrder ? answer.order : null,
    isNotFound: !isValidId || (isAnswered && answer.isNotFound),
    message: isAnswered ? answer.message : null,
    reload,
    refresh,
  };
}
