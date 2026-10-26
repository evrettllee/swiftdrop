import { expect, test } from '@playwright/test';
import { CHAT_SENDER_ROLE } from '@/shared/api';
import { decideIncomingToast, INCOMING_TOAST, type IncomingToastSource } from './incoming-toast';

const FROM_CLIENT_TO_COURIER: IncomingToastSource = {
  senderRole: CHAT_SENDER_ROLE.CLIENT,
  ownRole: CHAT_SENDER_ROLE.COURIER,
  isChatOpen: false,
  isPageHidden: false,
};

test('should show a toast for a message of the other side while the chat is closed', () => {
  expect(decideIncomingToast(FROM_CLIENT_TO_COURIER)).toBe(INCOMING_TOAST.SHOW);
});

test('should show no toast for an own message, sent from another tab too', () => {
  expect(
    decideIncomingToast({ ...FROM_CLIENT_TO_COURIER, senderRole: CHAT_SENDER_ROLE.COURIER }),
  ).toBe(INCOMING_TOAST.SKIP);
  expect(
    decideIncomingToast({
      ...FROM_CLIENT_TO_COURIER,
      senderRole: CHAT_SENDER_ROLE.COURIER,
      isPageHidden: true,
    }),
  ).toBe(INCOMING_TOAST.SKIP);
});

test('should show no toast while the chat is open and seen', () => {
  expect(decideIncomingToast({ ...FROM_CLIENT_TO_COURIER, isChatOpen: true })).toBe(
    INCOMING_TOAST.SKIP,
  );
});

test('should keep the message for the return while the tab is hidden, the chat open or not', () => {
  expect(decideIncomingToast({ ...FROM_CLIENT_TO_COURIER, isPageHidden: true })).toBe(
    INCOMING_TOAST.DEFER,
  );
  expect(
    decideIncomingToast({ ...FROM_CLIENT_TO_COURIER, isPageHidden: true, isChatOpen: true }),
  ).toBe(INCOMING_TOAST.DEFER);
});
