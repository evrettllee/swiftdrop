import { isFinishedStatus } from '@/entities/order';
import type { OrderStatus } from '@/shared/api';
import { APP_ROUTES, getCourierHistoryOrderPath, getOrderPath } from '@/shared/routes';
import { ROLE, useAuthStore } from '@/shared/session';
import { type AuthorRole, TOPICS_BY_ROLE, type TopicOption } from '../config/new-ticket';

export type SupportRole = {
  role: AuthorRole;
  supportPath: string;
  profilePath: string;
  topics: readonly TopicOption[];
  orderPath: (orderId: number, status: OrderStatus) => string;
};

const FIRST_HISTORY_PAGE = 1;

const SUPPORT_ROLES: Record<AuthorRole, SupportRole> = {
  [ROLE.CLIENT]: {
    role: ROLE.CLIENT,
    supportPath: APP_ROUTES.SUPPORT,
    profilePath: APP_ROUTES.PROFILE,
    topics: TOPICS_BY_ROLE[ROLE.CLIENT],
    orderPath: (orderId) => getOrderPath(orderId),
  },
  [ROLE.COURIER]: {
    role: ROLE.COURIER,
    supportPath: APP_ROUTES.COURIER_SUPPORT,
    profilePath: APP_ROUTES.COURIER_PROFILE,
    topics: TOPICS_BY_ROLE[ROLE.COURIER],
    orderPath: (orderId, status) =>
      isFinishedStatus(status)
        ? getCourierHistoryOrderPath(orderId, FIRST_HISTORY_PAGE)
        : APP_ROUTES.COURIER_WORK,
  },
};

export function useSupportRole(): SupportRole {
  const role = useAuthStore((state) => state.user?.role);

  return SUPPORT_ROLES[role === ROLE.COURIER ? ROLE.COURIER : ROLE.CLIENT];
}
