import { useCallback, useState } from 'react';
import { useIncomingMessageToast, useOrderChatView } from '@/features/order-chat';
import { CHAT_SENDER_ROLE, type ClientOrderCourier, type OrderDetails } from '@/shared/api';
import { MAIN_COLUMN_CLASS, SIDE_COLUMN_CLASS, SIDE_COLUMN_LAYOUT_CLASS } from '@/shared/config';
import { getOrderPath } from '@/shared/routes';
import { Divider } from '@/shared/ui/divider';
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
  useIncomingMessageToast({
    orderId: courier === null ? null : order.orderId,
    ownRole: CHAT_SENDER_ROLE.CLIENT,
    senderName: courier?.name ?? '',
    chatPath: getOrderPath(order.orderId),
  });

  const openCancel = useCallback(() => setIsCancelOpen(true), []);
  const closeCancel = useCallback(() => setIsCancelOpen(false), []);
  const handleCancelled = useCallback(() => {
    setIsCancelOpen(false);
    onReload();
  }, [onReload]);

  if (courier !== null && chatView.isScreenOpen) {
    return <OrderChat chat={live.chat} courier={courier} view={chatView} />;
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <OrderHeader order={order} />
      <div className={SIDE_COLUMN_LAYOUT_CLASS}>
        <div className={`contents lg:flex lg:flex-col lg:gap-8 ${MAIN_COLUMN_CLASS}`}>
          <OrderStatusLine order={order} paymentReturn={paymentReturn} tracking={live.tracking} />
          <OrderRoute
            order={order}
            tracking={live.tracking}
            routeReloadToken={live.routeReloadToken}
            vehicleType={courier?.vehicle?.type ?? null}
          />
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
            onCancel={openCancel}
          />
        </div>
      </div>
      <CancelOrderDialog
        order={order}
        isOpen={isCancelOpen}
        onClose={closeCancel}
        onCancelled={handleCancelled}
      />
      {courier !== null && chatView.isDrawerOpen ? (
        <OrderChat chat={live.chat} courier={courier} view={chatView} />
      ) : null}
    </div>
  );
}
