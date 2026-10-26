import type { LocationSharing } from '@/features/courier-location';
import { useActiveOrderChat, useOrderChatView } from '@/features/order-chat';
import type { CourierOrder, CourierVehicle } from '@/shared/api';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ORDER_ACTION, type OrderStep } from '../config/order-steps';
import { useOrderStep } from '../model/useOrderStep';
import { ConnectionAlert } from './ConnectionAlert';
import { CourierChat } from './CourierChat';
import { CourierChatButton } from './CourierChatButton';
import { GeoAlert } from './GeoAlert';
import { OrderActionBar } from './OrderActionBar';
import { OrderHeader } from './OrderHeader';
import { OrderMap } from './OrderMap';
import { OrderParcel } from './OrderParcel';
import { OrderStepButton } from './OrderStepButton';
import { OrderStops } from './OrderStops';

type OrderScreenProps = {
  order: CourierOrder;
  step: OrderStep;
  vehicle: CourierVehicle;
  location: LocationSharing;
  // The order has moved on while the code was entered: the text of the backend.
  deliveryError: string | null;
  // The courier comes back from the code screen: its button is gone, the focus goes to the title.
  isFocusOnTitle: boolean;
  onChanged: (order: CourierOrder) => void;
  onStale: () => void;
  onEnterCode: () => void;
};

// One column on a phone with the button in a bar above the menu; on the desktop the points on the
// left and the parcel with the button on the right.
export function OrderScreen({
  order,
  step,
  vehicle,
  location,
  deliveryError,
  isFocusOnTitle,
  onChanged,
  onStale,
  onEnterCode,
}: OrderScreenProps) {
  const orderStep = useOrderStep({ onDone: onChanged, onStale });
  const chat = useActiveOrderChat();
  const chatView = useOrderChatView(true);
  const error = orderStep.error ?? deliveryError;
  const button = (
    <OrderStepButton
      step={step}
      isPending={orderStep.isPending}
      onPress={
        step.action === ORDER_ACTION.ENTER_CODE
          ? () => {
              if (chatView.isOpen) {
                chatView.closeChat();
              }

              onEnterCode();
            }
          : () => void orderStep.run(order.orderId, step.action)
      }
    />
  );

  if (chatView.isScreenOpen) {
    return <CourierChat chat={chat} order={order} view={chatView} />;
  }

  return (
    // On a phone the end of the page stays clear of the bar with the button (24px above it).
    <div className="flex flex-col gap-6 pb-15 lg:gap-8 lg:pb-0">
      <OrderHeader orderId={order.orderId} step={step} isFocusOnMount={isFocusOnTitle} />
      <ConnectionAlert />
      {location.problem === null ? null : (
        <GeoAlert
          problem={location.problem}
          isChecking={location.isChecking}
          onRetry={() => void location.recheck()}
        />
      )}
      {error === null ? null : <InlineAlert variant="error">{error}</InlineAlert>}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-1 lg:gap-8">
          <OrderMap order={order} />
          <OrderStops
            order={order}
            step={step}
            vehicle={vehicle.type}
            chatButton={
              <CourierChatButton
                buttonRef={chatView.chatButtonRef}
                unreadCount={chat.unreadCount}
                isChatOpen={chatView.isOpen}
                chatId={chatView.chatId}
                onToggle={chatView.isOpen ? chatView.closeChat : chatView.openChat}
              />
            }
          />
        </div>
        <div className="lg:hidden">
          <Divider />
        </div>
        <OrderParcel order={order} step={step} button={button} />
      </div>
      <OrderActionBar>{button}</OrderActionBar>
      {chatView.isDrawerOpen ? <CourierChat chat={chat} order={order} view={chatView} /> : null}
    </div>
  );
}
