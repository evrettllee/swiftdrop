import { formatOrderNumber } from '@/entities/order';
import {
  Chat,
  ChatCallLink,
  ChatDrawer,
  type ChatPerson,
  ChatScreen,
  type OrderChat,
  type OrderChatView,
} from '@/features/order-chat';
import { type CourierOrder, ORDER_STATUS } from '@/shared/api';
import { getNameInitials } from '@/shared/lib/format';
import { COURIER_CHAT_TEXTS } from '../config/texts';

type CourierChatProps = {
  chat: OrderChat;
  order: CourierOrder;
  view: OrderChatView;
};

function toPerson(order: CourierOrder): ChatPerson {
  return {
    initials: getNameInitials(order.sender.name),
    name: order.sender.name,
    details: COURIER_CHAT_TEXTS.details(formatOrderNumber(order.orderId)),
  };
}

export function CourierChat({ chat, order, view }: CourierChatProps) {
  const person = toPerson(order);
  const { phone } = order.sender;
  const call =
    phone === null ? null : <ChatCallLink phone={phone} label={COURIER_CHAT_TEXTS.CALL} />;
  const replies =
    order.status === ORDER_STATUS.COURIER_ASSIGNED
      ? COURIER_CHAT_TEXTS.BEFORE_PICKUP_REPLIES
      : COURIER_CHAT_TEXTS.AFTER_PICKUP_REPLIES;
  const body = (
    <Chat chat={chat}>
      <Chat.Messages />
      {chat.isLoaded && chat.canSend ? (
        <Chat.Footer>
          <Chat.QuickReplies replies={replies} />
          <Chat.Composer label={COURIER_CHAT_TEXTS.MESSAGE_LABEL} autoFocus={view.isDrawerOpen} />
        </Chat.Footer>
      ) : null}
      {chat.isLoaded && !chat.canSend ? <Chat.ClosedNote /> : null}
    </Chat>
  );

  return view.isDrawerOpen ? (
    <ChatDrawer
      id={view.chatId}
      label={COURIER_CHAT_TEXTS.CHAT_LABEL}
      person={person}
      call={call}
      onClose={view.closeChat}
    >
      {body}
    </ChatDrawer>
  ) : (
    <ChatScreen
      id={view.chatId}
      label={COURIER_CHAT_TEXTS.CHAT_LABEL}
      person={person}
      call={call}
      onBack={view.closeChat}
    >
      {body}
    </ChatScreen>
  );
}
