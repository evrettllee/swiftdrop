import type { ChatSenderRole } from '@/shared/api';

export const INCOMING_TOAST = {
  SHOW: 'show',
  DEFER: 'defer',
  SKIP: 'skip',
} as const;

export type IncomingToast = (typeof INCOMING_TOAST)[keyof typeof INCOMING_TOAST];

export type IncomingToastSource = {
  senderRole: ChatSenderRole;
  ownRole: ChatSenderRole;
  isChatOpen: boolean;
  isPageHidden: boolean;
};

export function decideIncomingToast({
  senderRole,
  ownRole,
  isChatOpen,
  isPageHidden,
}: IncomingToastSource): IncomingToast {
  if (senderRole === ownRole) {
    return INCOMING_TOAST.SKIP;
  }

  if (isPageHidden) {
    return INCOMING_TOAST.DEFER;
  }

  return isChatOpen ? INCOMING_TOAST.SKIP : INCOMING_TOAST.SHOW;
}
