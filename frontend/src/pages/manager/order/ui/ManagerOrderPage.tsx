import { MagnifyingGlassIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useParams } from 'react-router';
import { APP_ROUTES, ORDER_ID_PARAM } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ContentLoader } from '@/shared/ui/page-loader';
import { MANAGER_ORDER_TEXTS as TEXTS } from '../config/texts';
import { ORDER_LOAD, useManagerOrder } from '../model/useManagerOrder';
import { useLiveOrder } from '../model/useLiveOrder';
import { OrderView } from './OrderView';

const ORDER_ID_PATTERN = /^[1-9]\d{0,9}$/;

function parseOrderId(raw: string | undefined): number | null {
  return raw !== undefined && ORDER_ID_PATTERN.test(raw) ? Number(raw) : null;
}

export function ManagerOrderPage() {
  const orderId = parseOrderId(useParams()[ORDER_ID_PARAM]);
  const { load, order, reload } = useManagerOrder(orderId);
  useLiveOrder(orderId, reload);

  if (order !== null) {
    return <OrderView order={order} onChanged={reload} />;
  }

  if (load === ORDER_LOAD.NOT_FOUND) {
    return (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title={TEXTS.NOT_FOUND_TITLE}
        text={TEXTS.NOT_FOUND_TEXT}
      >
        <LinkButton variant="secondary" to={APP_ROUTES.MANAGER_ORDERS}>
          {TEXTS.BACK_TO_ORDERS}
        </LinkButton>
      </EmptyState>
    );
  }

  if (load === ORDER_LOAD.ERROR) {
    return (
      <div className="flex flex-col items-start gap-4">
        <InlineAlert variant="error" icon={WarningCircleIcon} title={TEXTS.LOAD_FAILED_TITLE}>
          {TEXTS.LOAD_FAILED}
        </InlineAlert>
        <Button variant="secondary" onClick={reload}>
          {TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  return <ContentLoader />;
}
