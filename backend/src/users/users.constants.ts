export const USERS_CONSTRAINTS = {
  EMAIL_UNIQUE: 'users_email_active_uidx',
  PHONE_UNIQUE: 'users_phone_unique',
} as const;

export const USERS_ERROR_MESSAGES = {
  ROLE_NOT_FOUND: 'Роль пользователя не найдена',
  EMAIL_TAKEN: 'Пользователь с таким email уже зарегистрирован',
  PHONE_TAKEN: 'Пользователь с таким телефоном уже зарегистрирован',
} as const;

export const USERS_CONFLICT_MESSAGES: Record<string, string> = {
  [USERS_CONSTRAINTS.EMAIL_UNIQUE]: USERS_ERROR_MESSAGES.EMAIL_TAKEN,
  [USERS_CONSTRAINTS.PHONE_UNIQUE]: USERS_ERROR_MESSAGES.PHONE_TAKEN,
};
