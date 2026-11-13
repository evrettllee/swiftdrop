import { ROLE } from '@/common/enums/role.enum';

const USERS_SEGMENT = 'users';

export const ADMIN_ROUTES = {
  BASE: 'admin',
  USERS: USERS_SEGMENT,
  USERS_COUNTS: `${USERS_SEGMENT}/counts`,
  USER: `${USERS_SEGMENT}/:userId`,
} as const;

export const USER_ID_PARAM = 'userId';

export const MANAGED_ROLES = [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER] as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  INVITED: 'invited',
  DELETED: 'deleted',
} as const;

export const USER_STATUS_VALUES = [
  USER_STATUS.ACTIVE,
  USER_STATUS.BLOCKED,
  USER_STATUS.INVITED,
  USER_STATUS.DELETED,
] as const;

export const DEFAULT_USER_STATUSES = [
  USER_STATUS.ACTIVE,
  USER_STATUS.BLOCKED,
  USER_STATUS.INVITED,
] as const;

export const ADMIN_USER_SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  NAME: 'name',
} as const;

export const ADMIN_USER_SORT_VALUES = [
  ADMIN_USER_SORT.NEWEST,
  ADMIN_USER_SORT.OLDEST,
  ADMIN_USER_SORT.NAME,
] as const;

export const ADMIN_USER_SORT_KEY = {
  CREATED_AT: 'createdAt',
  NAME: 'name',
} as const;

export const ADMIN_USERS_PAGE_SIZE_DEFAULT = 20;
export const PHONE_SEARCH_MIN_DIGITS = 7;
export const ADMIN_RECENT_ORDERS_LIMIT = 5;
export const ADMIN_HISTORY_LIMIT = 20;

export const USER_NOT_FOUND_MESSAGE = 'Пользователь не найден';

export const ADMIN_USERS_VALIDATION_MESSAGES = {
  ROLE_INVALID: 'Укажите роль: client, courier или manager',
  STATUS_INVALID: 'Неизвестный статус пользователя',
  SORT_INVALID: 'Сортировка: newest, oldest или name',
  USER_ID_INVALID: 'Некорректный номер пользователя',
} as const;
