export const DELETED_USER_FIRST_NAME = 'Удалённый пользователь';
export const DELETED_USER_LAST_NAME = '';
export const DELETED_EMAIL_DOMAIN = 'swiftdrop.invalid';

export function deletedUserEmail(userId: number): string {
  return `deleted-${userId}@${DELETED_EMAIL_DOMAIN}`;
}

export const ADMIN_DELETE_MESSAGES = {
  ALREADY_DELETED: 'Пользователь уже удалён',
  ACTIVE_ORDER: 'Есть активный заказ. Удалить можно после его завершения',
} as const;

export const ADMIN_DELETE_LOG_MESSAGES = {
  USER_DELETED: 'User deleted and anonymized',
} as const;
