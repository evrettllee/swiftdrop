import {
  CHAT_SENDER_ROLE,
  type ChatHistory,
  type ChatMessage,
  type ChatSenderRole,
} from '@/shared/api';

// The chat of one order as the page keeps it: the messages loaded so far, oldest first by their id,
// each one once, whether it came with a page of the history, as the answer to a sent message or with
// message:new.
export type ChatState = {
  messages: ChatMessage[];
  // The id to ask the next, older page before; null once the oldest page is here.
  nextBeforeId: number | null;
  // Messages to the user not read yet, as the backend counted them plus the new ones since.
  unreadCount: number;
  canSend: boolean;
  isLoaded: boolean;
};

export const EMPTY_CHAT: ChatState = {
  messages: [],
  nextBeforeId: null,
  unreadCount: 0,
  canSend: false,
  isLoaded: false,
};

// One copy per id, the later one winning, ordered by id: the id grows with the time of sending.
function mergeMessages(
  kept: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();

  for (const message of [...kept, ...incoming]) {
    byId.set(message.messageId, message);
  }

  return [...byId.values()].toSorted((first, second) => first.messageId - second.messageId);
}

function newestId(messages: readonly ChatMessage[]): number {
  return messages.at(-1)?.messageId ?? 0;
}

// The newest page, on opening or after a lost connection. When more messages came meanwhile than a
// page holds, the page does not reach the kept ones: they are dropped, and older pages are asked
// for from this page on, so no message is ever missing in between.
export function withLatestPage(state: ChatState, page: ChatHistory): ChatState {
  const oldestOfPage = page.items[0]?.messageId;
  const hasGap =
    state.messages.length > 0 &&
    page.nextBeforeId !== null &&
    oldestOfPage !== undefined &&
    oldestOfPage > newestId(state.messages);
  const isFresh = state.messages.length === 0 || hasGap;

  return {
    messages: isFresh ? [...page.items] : mergeMessages(state.messages, page.items),
    nextBeforeId: isFresh ? page.nextBeforeId : state.nextBeforeId,
    unreadCount: page.unreadCount,
    canSend: page.canSend,
    isLoaded: true,
  };
}

// An older page, asked for before the oldest message kept.
export function withOlderPage(state: ChatState, page: ChatHistory): ChatState {
  return {
    ...state,
    messages: mergeMessages(state.messages, page.items),
    nextBeforeId: page.nextBeforeId,
  };
}

// A message sent from this tab or one that came with message:new. A message already kept changes
// nothing; a new unread one from the other side adds to the counter.
export function withMessage(
  state: ChatState,
  message: ChatMessage,
  ownRole: ChatSenderRole,
): ChatState {
  if (state.messages.some(({ messageId }) => messageId === message.messageId)) {
    return state;
  }

  const isUnreadIncoming = message.senderRole !== ownRole && !message.isRead;

  return {
    ...state,
    messages: mergeMessages(state.messages, [message]),
    unreadCount: state.unreadCount + (isUnreadIncoming ? 1 : 0),
  };
}

// Marks read the messages of `senderRole` up to the id and tells how many changed.
function markRead(
  messages: readonly ChatMessage[],
  senderRole: ChatSenderRole,
  upToMessageId: number,
): { messages: ChatMessage[]; marked: number } {
  let marked = 0;
  const next = messages.map((message) => {
    const isMarked =
      message.senderRole === senderRole && !message.isRead && message.messageId <= upToMessageId;
    marked += isMarked ? 1 : 0;

    return isMarked ? { ...message, isRead: true } : message;
  });

  return { messages: next, marked };
}

// message:read. The other side read the messages of the user: they get the double tick. The user
// read their messages in another tab: the counter goes down by those marked here.
export function withRead(
  state: ChatState,
  readerRole: ChatSenderRole,
  upToMessageId: number,
  ownRole: ChatSenderRole,
): ChatState {
  const isOwnReading = readerRole === ownRole;
  const writerRole = isOwnReading ? otherRole(ownRole) : ownRole;
  const { messages, marked } = markRead(state.messages, writerRole, upToMessageId);

  return {
    ...state,
    messages,
    unreadCount: isOwnReading ? Math.max(0, state.unreadCount - marked) : state.unreadCount,
  };
}

// The answer to marking read from this tab: the counter of the backend replaces the kept one.
export function withReadResult(
  state: ChatState,
  upToMessageId: number,
  unreadCount: number,
  ownRole: ChatSenderRole,
): ChatState {
  const { messages } = markRead(state.messages, otherRole(ownRole), upToMessageId);

  return { ...state, messages, unreadCount };
}

function otherRole(role: ChatSenderRole): ChatSenderRole {
  return role === CHAT_SENDER_ROLE.CLIENT ? CHAT_SENDER_ROLE.COURIER : CHAT_SENDER_ROLE.CLIENT;
}
