import { ROLE } from '@/common/enums/role.enum';
import { STAFF_ROLES } from '../constants/realtime.constants';
import type {
  AppSocketData,
  SocketSession,
  StaffRole,
  StaffSocketData,
} from '../types/realtime.types';

const staffRoles = new Set<string>(STAFF_ROLES);

function isStaffRole(role: string): role is StaffRole {
  return staffRoles.has(role);
}

export function isStaffSocket(data: AppSocketData): data is StaffSocketData {
  return isStaffRole(data.role);
}

// What a socket keeps about who opened it, or null when the role may not open one. The courier
// profile is looked up only for a courier.
export async function buildSocketData(
  session: SocketSession,
  findCourierProfileId: (userId: number) => Promise<number>,
): Promise<AppSocketData | null> {
  const { user, expiresAtMs } = session;
  const common = { userId: user.userId, sessionExpiresAtMs: expiresAtMs, orderJoinAttemptsMs: [] };
  let data: AppSocketData | null = null;

  if (user.role === ROLE.COURIER) {
    data = {
      ...common,
      role: ROLE.COURIER,
      courierProfileId: await findCourierProfileId(user.userId),
      lastLocationAtMs: null,
    };
  } else if (user.role === ROLE.CLIENT) {
    data = { ...common, role: ROLE.CLIENT };
  } else if (isStaffRole(user.role)) {
    data = { ...common, role: user.role };
  }

  return data;
}
