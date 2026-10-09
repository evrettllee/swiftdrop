import { MagnifyingGlassIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { type ReactNode, useState } from 'react';
import { useParams } from 'react-router';
import { LIST_STATUS } from '@/shared/config';
import { APP_ROUTES, ORDER_ID_PARAM } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Spinner } from '@/shared/ui/spinner';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { useOrderDetails } from '../model/useOrderDetails';
import { usePaymentReturn } from '../model/usePaymentReturn';
import { CancelOrderDialog } from './CancelOrderDialog';
import { OrderHeader } from './OrderHeader';
import { OrderPaymentAlert } from './OrderPaymentAlert';
import { OrderPaymentPanel } from './OrderPaymentPanel';
import { OrderProgress } from './OrderProgress';
import { OrderRecipient } from './OrderRecipient';
import { OrderRoute } from './OrderRoute';

const DIVIDER = <hr className="border-border" />;

export function OrderPage() {
  const params = useParams();
  const details = useOrderDetails(Number(params[ORDER_ID_PARAM]));
  const paymentReturn = usePaymentReturn(details.order, details.reload);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  let content: ReactNode;

  function handleCancelled(): void {
    setIsCancelOpen(false);
    details.reload();
  }

  if (details.order !== null) {
    const order = details.order;

    content = (
      <div className="flex flex-col gap-6 lg:gap-8">
        <OrderHeader order={order} />
        <OrderPaymentAlert
          order={order}
          isChecking={paymentReturn.isChecking}
          isFailed={paymentReturn.isFailed}
        />
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
            <OrderProgress order={order} />
            {DIVIDER}
            <OrderRoute order={order} />
            {DIVIDER}
            <OrderRecipient order={order} />
          </div>
          <OrderPaymentPanel
            order={order}
            isPayFailed={paymentReturn.isFailed}
            onCancel={() => setIsCancelOpen(true)}
          />
        </div>
        <CancelOrderDialog
          order={order}
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          onCancelled={handleCancelled}
        />
      </div>
    );
  } else if (details.status === LIST_STATUS.LOADING) {
    content = (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
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
