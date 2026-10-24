import { useCourierProfile } from '@/entities/courier';
import { useOrderChat } from '@/features/order-chat';
import { CHAT_SENDER_ROLE } from '@/shared/api';
import { useOrderRoom } from '@/shared/realtime';

// The cabinet is in the room of the order the courier carries, whichever page is open, so the
// messages of the client reach the courier anywhere; it leaves the room once the order is over.
// The chat of the order is kept from its newest page on and loaded again after a lost connection.
export function useActiveOrderRoom(): void {
  const activeOrderId = useCourierProfile()?.activeOrderId ?? null;
  const rejoins = useOrderRoom(activeOrderId);

  useOrderChat(activeOrderId, CHAT_SENDER_ROLE.COURIER, rejoins);
}
