import { ChatClosedNote } from './ChatClosedNote';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatQuickReplies } from './ChatQuickReplies';
import { ChatFooter, ChatRoot } from './ChatRoot';

export const Chat = Object.assign(ChatRoot, {
  Header: ChatHeader,
  Messages: ChatMessages,
  Footer: ChatFooter,
  QuickReplies: ChatQuickReplies,
  Composer: ChatComposer,
  ClosedNote: ChatClosedNote,
});
