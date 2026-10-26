import { ROLE } from '../../../common/enums/role.enum';
import type { SocketSession } from '../../realtime/types/realtime.types';
import type { AppSocketData } from '../types/couriers-socket.types';

// What a socket keeps about who opened it, or null when the role may not open one. The courier
// profile is looked up only for a courier.
export async function buildSocketData(
  session: SocketSession,
  findCourierProfileId: (userId: number) => Promise<number>,
): Promise<AppSocketData | null> {
  const { user, expiresAtMs } = session;
  let data: AppSocketData | null = null;

  if (user.role === ROLE.COURIER) {
    data = {
      role: ROLE.COURIER,
      userId: user.userId,
      courierProfileId: await findCourierProfileId(user.userId),
      sessionExpiresAtMs: expiresAtMs,
      orderJoinAttemptsMs: [],
      lastLocationAtMs: null,
    };
  } else if (user.role === ROLE.CLIENT) {
    data = {
      role: ROLE.CLIENT,
      userId: user.userId,
      sessionExpiresAtMs: expiresAtMs,
      orderJoinAttemptsMs: [],
    };
  }

  return data;
}
