import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { buildOrderProgress, OrderProgressSteps } from '@/entities/order';
import { LIST_STATUS, MAIN_COLUMN_CLASS, SIDE_COLUMN_LAYOUT_CLASS } from '@/shared/config';
import {
  getCourierHistoryPath,
  HISTORY_PAGE_PARAM,
  ORDER_ID_PARAM,
  parseHistoryPage,
} from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { COURIER_PROGRESS_STEPS, COURIER_PROGRESS_STOP_LABELS } from '../config/progress';
import { HISTORY_ORDER_TEXTS } from '../config/texts';
import { useHistoryOrder } from '../model/useHistoryOrder';
import { HistoryOrderHeader } from './HistoryOrderHeader';
import { HistoryOrderParcel } from './HistoryOrderParcel';
import { HistoryOrderRoute } from './HistoryOrderRoute';
import { HistoryOrderSkeleton } from './HistoryOrderSkeleton';

// A finished order of the courier: where it went, how it went and what the parcel was. Opened
// from a card of the history, which puts its page in the address for the way back.
export function HistoryOrderPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const historyPage = parseHistoryPage(searchParams.get(HISTORY_PAGE_PARAM));
  const { order, status, isNotFound, retry } = useHistoryOrder(Number(params[ORDER_ID_PARAM]));
  let content: ReactNode;

  if (order !== null) {
    content = (
      <div className="flex flex-col gap-6 lg:gap-8">
        <HistoryOrderHeader order={order} historyPage={historyPage} />
        <div className={SIDE_COLUMN_LAYOUT_CLASS}>
          <div className={`${MAIN_COLUMN_CLASS} flex flex-col gap-6 lg:gap-8`}>
            <HistoryOrderRoute order={order} />
            <Divider />
            <OrderProgressSteps
              title={HISTORY_ORDER_TEXTS.SECTION_PROGRESS}
              steps={buildOrderProgress(order, {
                steps: COURIER_PROGRESS_STEPS,
                stopLabels: COURIER_PROGRESS_STOP_LABELS,
              })}
            />
          </div>
          <div className="lg:hidden">
            <Divider />
          </div>
          <HistoryOrderParcel order={order} />
        </div>
      </div>
    );
  } else if (status === LIST_STATUS.LOADING) {
    content = <HistoryOrderSkeleton />;
  } else if (isNotFound) {
    content = (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title={HISTORY_ORDER_TEXTS.NOT_FOUND_TITLE}
        text={HISTORY_ORDER_TEXTS.NOT_FOUND_TEXT}
      >
        <LinkButton variant="secondary" to={getCourierHistoryPath(historyPage)}>
          {HISTORY_ORDER_TEXTS.BACK}
        </LinkButton>
      </EmptyState>
    );
  } else {
    content = (
      <div className="flex flex-col items-start gap-4">
        <InlineAlert variant="error">{HISTORY_ORDER_TEXTS.LOAD_ERROR}</InlineAlert>
        <Button variant="secondary" onClick={retry}>
          {HISTORY_ORDER_TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  return content;
}
