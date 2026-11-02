import { ROLE, type Role } from '@/shared/session';
import { APP_ROUTES } from './app-routes';

// The page a user lands on after signing in.
export const ROLE_HOME_ROUTE: Record<Role, string> = {
  [ROLE.CLIENT]: APP_ROUTES.ORDERS,
  [ROLE.COURIER]: APP_ROUTES.COURIER_WORK,
  [ROLE.MANAGER]: APP_ROUTES.MANAGER_ORDERS,
  [ROLE.ADMIN]: APP_ROUTES.MANAGER_ORDERS,
};
