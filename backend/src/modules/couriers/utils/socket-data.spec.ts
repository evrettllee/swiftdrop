import { ROLE, type RoleName } from '@/common/enums/role.enum';
import type { SocketSession } from '@/modules/realtime/types/realtime.types';
import { buildSocketData } from './socket-data';

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

  it.each([ROLE.MANAGER, ROLE.ADMIN])(
    'should refuse the socket when a %s connects',
    async (role) => {
      const data = await buildSocketData(session(role), findCourierProfileId);

      expect(data).toBeNull();
      expect(findCourierProfileId).not.toHaveBeenCalled();
    },
  );
});
