import { useState } from 'react';
import type { ClientOrderCourier, OrderDetails } from '@/shared/api';
import { MAIN_COLUMN_CLASS, SIDE_COLUMN_CLASS, SIDE_COLUMN_LAYOUT_CLASS } from '@/shared/config';
import { Divider } from '@/shared/ui/divider';
import { useOrderChatView } from '../model/useOrderChatView';
import type { OrderLive } from '../model/useOrderLive';
import { CancelOrderDialog } from './CancelOrderDialog';
import { OrderChat } from './OrderChat';
import { OrderCourier } from './OrderCourier';
import { OrderDeliveryCode } from './OrderDeliveryCode';
import { OrderHeader } from './OrderHeader';
import { OrderPaymentPanel } from './OrderPaymentPanel';
import { OrderProgress } from './OrderProgress';
import { OrderRecipient } from './OrderRecipient';
import { OrderRoute } from './OrderRoute';
import { OrderStatusLine } from './OrderStatusLine';

type OrderContentProps = {
  order: OrderDetails;
  courier: ClientOrderCourier['courier'];
  deliveryCode: string | null;
  paymentReturn: { isChecking: boolean; isFailed: boolean };
  live: OrderLive;
  onReload: () => void;
};

export function OrderContent({
  order,
  courier,
  deliveryCode,
  paymentReturn,
  live,
  onReload,
}: OrderContentProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const chatView = useOrderChatView(courier !== null);

  function handleCancelled(): void {
    setIsCancelOpen(false);
    onReload();
  }

  if (courier !== null && chatView.isScreenOpen) {
    return <OrderChat chat={live.chat} courier={courier} view={chatView} />;
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <OrderHeader order={order} />
      <div className={SIDE_COLUMN_LAYOUT_CLASS}>
        <div className={`contents lg:flex lg:flex-col lg:gap-8 ${MAIN_COLUMN_CLASS}`}>
          <OrderStatusLine
            order={order}
            paymentReturn={paymentReturn}
            tracking={live.trackingState}
          />
          <OrderRoute order={order} live={live} vehicleType={courier?.vehicle?.type ?? null} />
          {courier === null ? null : (
            <>
              <Divider />
              <OrderCourier
                courier={courier}
                unreadCount={live.chat.unreadCount}
                chatButtonRef={chatView.chatButtonRef}
                isChatOpen={chatView.isOpen}
                chatId={chatView.chatId}
                onChatToggle={chatView.isOpen ? chatView.closeChat : chatView.openChat}
              />
            </>
          )}
          <Divider />
          <OrderProgress order={order} />
          <Divider />
          <OrderRecipient order={order} />
        </div>
        <div className={`contents lg:flex lg:flex-col lg:gap-6 ${SIDE_COLUMN_CLASS}`}>
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
      {courier !== null && chatView.isDrawerOpen ? (
        <OrderChat chat={live.chat} courier={courier} view={chatView} />
      ) : null}
    </div>
  );
}
