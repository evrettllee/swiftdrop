import type { AdminUserCard } from '../api/admin-user-card';

const CREATED_AT = new Date('2026-10-05T13:40:00Z');
const ADMIN = { firstName: 'Андрей', lastName: 'Ковалёв' };

export function cardFixture(overrides: Partial<AdminUserCard> = {}): AdminUserCard {
  return {
    userId: 42,
    role: 'courier',
    status: 'active',
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'ivan.petrov@swiftdrop.test',
    phone: '+375291204567',
    createdAt: CREATED_AT,
    lastLoginAt: null,
    login: { password: true, google: false, yandex: false },
    block: null,
    invite: null,
    deletion: null,
    courier: {
      vehicleType: 'bicycle',
      deliveredCount: 148,
      cancelledCount: 3,
      isAvailable: false,
      activeOrderId: null,
    },
    orders: { total: 151, delivered: 148, cancelled: 3, recent: [] },
    history: [],
    ...overrides,
  };
}

export const FIXTURE_ADMIN = ADMIN;
