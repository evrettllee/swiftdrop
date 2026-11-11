import { ROLE, type RoleName } from '@/common/enums/role.enum';
import type { SocketSession } from '../types/realtime.types';
import { buildSocketData, isStaffSocket } from './socket-data';

const USER_ID = 7;
const COURIER_PROFILE_ID = 42;
const EXPIRES_AT_MS = 1_000_000;

function session(role: RoleName): SocketSession {
  return {
    user: {
      userId: USER_ID,
      firstName: 'Анна',
      lastName: 'Ковалёва',
      email: 'anna@example.com',
      phone: null,
      role,
    },
    expiresAtMs: EXPIRES_AT_MS,
  };
}

describe('buildSocketData', () => {
  let findCourierProfileId: jest.Mock<Promise<number>, [number]>;

  beforeEach(() => {
    findCourierProfileId = jest
      .fn<Promise<number>, [number]>()
      .mockResolvedValue(COURIER_PROFILE_ID);
  });

  it('should keep the courier profile and no position yet when a courier connects', async () => {
    const data = await buildSocketData(session(ROLE.COURIER), findCourierProfileId);

    expect(data).toEqual({
      role: ROLE.COURIER,
      userId: USER_ID,
      courierProfileId: COURIER_PROFILE_ID,
      sessionExpiresAtMs: EXPIRES_AT_MS,
      orderJoinAttemptsMs: [],
      lastLocationAtMs: null,
    });
    expect(findCourierProfileId).toHaveBeenCalledWith(USER_ID);
  });

  it('should keep only the user and the session end when a client connects', async () => {
    const data = await buildSocketData(session(ROLE.CLIENT), findCourierProfileId);

    expect(data).toEqual({
      role: ROLE.CLIENT,
      userId: USER_ID,
      sessionExpiresAtMs: EXPIRES_AT_MS,
      orderJoinAttemptsMs: [],
    });
    expect(findCourierProfileId).not.toHaveBeenCalled();
  });

  it.each([ROLE.MANAGER, ROLE.ADMIN])('should admit a %s as staff', async (role) => {
    const data = await buildSocketData(session(role), findCourierProfileId);

    expect(data).toEqual({
      role,
      userId: USER_ID,
      sessionExpiresAtMs: EXPIRES_AT_MS,
      orderJoinAttemptsMs: [],
    });
    expect(data && isStaffSocket(data)).toBe(true);
    expect(findCourierProfileId).not.toHaveBeenCalled();
  });

  it('should refuse the socket when the role is unknown', async () => {
    const data = await buildSocketData(session('guest' as RoleName), findCourierProfileId);

    expect(data).toBeNull();
  });
});

describe('isStaffSocket', () => {
  it.each([
    [ROLE.CLIENT, false],
    [ROLE.COURIER, false],
    [ROLE.MANAGER, true],
    [ROLE.ADMIN, true],
  ])('should tell whether a %s socket is staff: %s', async (role, isStaff) => {
    const data = await buildSocketData(session(role), () => Promise.resolve(COURIER_PROFILE_ID));

    expect(data && isStaffSocket(data)).toBe(isStaff);
  });
});
