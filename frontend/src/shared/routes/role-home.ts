import { ROLE, type Role } from '@/shared/session';
import { APP_ROUTES } from './app-routes';

// The page a user lands on after signing in. The client and the courier have an account area;
// the other roles go to the home page until theirs exist.
export const ROLE_HOME_ROUTE: Record<Role, string> = {
  [ROLE.CLIENT]: APP_ROUTES.ORDERS,
  [ROLE.COURIER]: APP_ROUTES.COURIER_WORK,
  [ROLE.MANAGER]: APP_ROUTES.HOME,
  [ROLE.ADMIN]: APP_ROUTES.HOME,
};
