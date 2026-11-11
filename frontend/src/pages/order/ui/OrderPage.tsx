import { MagnifyingGlassIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { LIST_STATUS } from '@/shared/config';
import { APP_ROUTES, ORDER_ID_PARAM } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { ContentLoader } from '@/shared/ui/page-loader';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { useOrderCourier } from '../model/useOrderCourier';
import { useOrderDetails } from '../model/useOrderDetails';
import { useOrderLive } from '../model/useOrderLive';
import { usePaymentReturn } from '../model/usePaymentReturn';
import { OrderContent } from './OrderContent';

export function OrderPage() {
  const params = useParams();
  const orderId = Number(params[ORDER_ID_PARAM]);
  const details = useOrderDetails(orderId);
  const paymentReturn = usePaymentReturn(details.order, details.reload);
  const status = details.order?.status ?? null;
  const { courier, deliveryCode, refresh: refreshCourier } = useOrderCourier(orderId, status);
  // The events of the room of the order keep the page in step: no polling.
  const live = useOrderLive(orderId, {
    order: details.order,
    courier,
    refresh: details.refresh,
    refreshCourier,
  });
  let content: ReactNode;

  if (details.order !== null) {
    content = (
      <OrderContent
        order={details.order}
        courier={courier}
        deliveryCode={deliveryCode}
        paymentReturn={paymentReturn}
        live={live}
        onReload={details.reload}
      />
    );
  } else if (details.status === LIST_STATUS.LOADING) {
    content = <ContentLoader />;
  } else if (details.isNotFound) {
    content = (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title={ORDER_DETAILS_TEXTS.NOT_FOUND_TITLE}
        text={ORDER_DETAILS_TEXTS.NOT_FOUND_TEXT}
      >
        <LinkButton variant="secondary" to={APP_ROUTES.ORDERS}>
          {ORDER_DETAILS_TEXTS.BACK_TO_ORDERS}
        </LinkButton>
      </EmptyState>
    );
  } else {
    content = (
      <EmptyState
        icon={WarningCircleIcon}
        title={ORDER_DETAILS_TEXTS.LOAD_FAILED_TITLE}
        text={details.message ?? ORDER_DETAILS_TEXTS.LOAD_FAILED}
      >
        <Button variant="secondary" onClick={details.reload}>
          {ORDER_DETAILS_TEXTS.RETRY}
        </Button>
      </EmptyState>
    );
  }

  return content;
}
