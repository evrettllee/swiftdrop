import { useState } from 'react';
import type { ClientOrderCourier, OrderDetails } from '@/shared/api';
import { Divider } from '@/shared/ui/divider';
import { CancelOrderDialog } from './CancelOrderDialog';
import { OrderCourier } from './OrderCourier';
import { OrderDeliveryCode } from './OrderDeliveryCode';
import { OrderHeader } from './OrderHeader';
import { OrderPaymentAlert } from './OrderPaymentAlert';
import { OrderPaymentPanel } from './OrderPaymentPanel';
import { OrderProgress } from './OrderProgress';
import { OrderRecipient } from './OrderRecipient';
import { OrderRoute } from './OrderRoute';

type OrderContentProps = {
  order: OrderDetails;
  courier: ClientOrderCourier['courier'];
  // Only what the backend gave for this status; null while there is nothing to show.
  deliveryCode: string | null;
  paymentReturn: { isChecking: boolean; isFailed: boolean };
  onReload: () => void;
};

// The order of the client. A phone has one column: the code and the courier come first, as what
// the client needs when the courier is near. The desktop has the details on the left and the code
// with the payment on the right.
export function OrderContent({
  order,
  courier,
  deliveryCode,
  paymentReturn,
  onReload,
}: OrderContentProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  function handleCancelled(): void {
    setIsCancelOpen(false);
    onReload();
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <OrderHeader order={order} />
      <OrderPaymentAlert
        order={order}
        isChecking={paymentReturn.isChecking}
        isFailed={paymentReturn.isFailed}
      />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
          {courier === null ? null : (
            <>
              <OrderCourier courier={courier} />
              <Divider />
            </>
          )}
          <OrderProgress order={order} />
          <Divider />
          <OrderRoute order={order} />
          <Divider />
          <OrderRecipient order={order} />
        </div>
        {/* On a phone the column does not exist: the code (first) and the payment are placed in
            the one column of the page. */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {deliveryCode === null ? null : <OrderDeliveryCode code={deliveryCode} />}
          <OrderPaymentPanel
            order={order}
            isPayFailed={paymentReturn.isFailed}
            onCancel={() => setIsCancelOpen(true)}
          />
        </div>
      </div>
      <CancelOrderDialog
        order={order}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onCancelled={handleCancelled}
      />
    </div>
  );
}
