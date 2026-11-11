import { memo } from 'react';
import { VEHICLE_TYPE_META } from '@/entities/courier';
import {
  Chat,
  ChatCallLink,
  ChatDrawer,
  type ChatPerson,
  ChatScreen,
  type OrderChat as OrderChatModel,
  type OrderChatView,
} from '@/features/order-chat';
import type { ClientOrderCourier } from '@/shared/api';
import { getNameInitials } from '@/shared/lib/format';
import { ORDER_COURIER_TEXTS } from '../config/tracking';

type OrderChatProps = {
  chat: OrderChatModel;
  courier: NonNullable<ClientOrderCourier['courier']>;
  view: OrderChatView;
  isCourierChanging: boolean;
};

function toPerson(courier: OrderChatProps['courier']): ChatPerson {
  const vehicle = courier.vehicle;
  const details = [
    ORDER_COURIER_TEXTS.COURIER_ROLE,
    vehicle === null ? '' : VEHICLE_TYPE_META[vehicle.type].label.toLowerCase(),
    vehicle?.licensePlate ?? '',
  ].filter((part) => part !== '');

  return {
    initials: getNameInitials(courier.name),
    name: courier.name,
    details: details.join(ORDER_COURIER_TEXTS.VEHICLE_SEPARATOR),
  };
}

export const OrderChat = memo(function OrderChat({
  chat,
  courier,
  view,
  isCourierChanging,
}: OrderChatProps) {
  const person = toPerson(courier);
  const label = ORDER_COURIER_TEXTS.chatWith(courier.name);
  const call =
    courier.phone === undefined ? null : (
      <ChatCallLink phone={courier.phone} label={ORDER_COURIER_TEXTS.CALL} />
    );
  const body = (
    <Chat chat={chat}>
      <Chat.Messages />
      {isCourierChanging ? <Chat.ClosedNote text={ORDER_COURIER_TEXTS.CHANGED_IN_CHAT} /> : null}
      {!isCourierChanging && chat.isLoaded && chat.canSend ? (
        <Chat.Footer>
          <Chat.QuickReplies replies={ORDER_COURIER_TEXTS.QUICK_REPLIES} />
          <Chat.Composer label={ORDER_COURIER_TEXTS.MESSAGE_LABEL} autoFocus={view.isDrawerOpen} />
        </Chat.Footer>
      ) : null}
      {!isCourierChanging && chat.isLoaded && !chat.canSend ? <Chat.ClosedNote /> : null}
    </Chat>
  );

  return view.isDrawerOpen ? (
    <ChatDrawer id={view.chatId} label={label} person={person} call={call} onClose={view.closeChat}>
      {body}
    </ChatDrawer>
  ) : (
    <ChatScreen id={view.chatId} label={label} person={person} call={call} onBack={view.closeChat}>
      {body}
    </ChatScreen>
  );
});
