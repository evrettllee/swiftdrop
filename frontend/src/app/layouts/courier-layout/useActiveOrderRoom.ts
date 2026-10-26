import { useCourierProfile } from '@/entities/courier';
import { useOrderRoom } from '@/shared/realtime';

// The cabinet is in the room of the order the courier carries, whichever page is open, so the
// messages of the client reach the courier anywhere; it leaves the room once the order is over.
// `joins` grows with each join, so the chat of the order is loaded again after a lost connection.
export function useActiveOrderRoom() {
  const activeOrderId = useCourierProfile()?.activeOrderId ?? null;
  const joins = useOrderRoom(activeOrderId);

  return { activeOrderId, joins };
}
