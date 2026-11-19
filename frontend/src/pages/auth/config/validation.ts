import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, PHONE_EXAMPLE } from '@/shared/lib/person-validation';

// Validation limits: must match backend/src/auth/constants/validation.ts
// Name and phone limits live in shared/lib/person-validation/person-validation.ts
export const EMAIL_MAX_LENGTH = 255;
export const EMAIL_EXAMPLE = 'name@example.com';

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Введите email',
  EMAIL_INVALID: `Введите email полностью, например ${EMAIL_EXAMPLE}`,
  EMAIL_TOO_LONG: `Email должен содержать не больше ${EMAIL_MAX_LENGTH} символов`,
  FIRST_NAME_REQUIRED: 'Введите имя',
  FIRST_NAME_TOO_SHORT: `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа`,
  FIRST_NAME_TOO_LONG: `Имя должно содержать не больше ${NAME_MAX_LENGTH} символов`,
  FIRST_NAME_INVALID: 'Имя может содержать только буквы, пробел, дефис и апостроф',
  LAST_NAME_REQUIRED: 'Введите фамилию',
  LAST_NAME_TOO_SHORT: `Фамилия должна содержать минимум ${NAME_MIN_LENGTH} символа`,
  LAST_NAME_TOO_LONG: `Фамилия должна содержать не больше ${NAME_MAX_LENGTH} символов`,
  LAST_NAME_INVALID: 'Фамилия может содержать только буквы, пробел, дефис и апостроф',
  PHONE_REQUIRED: 'Введите телефон',
  PHONE_INVALID: `Введите номер полностью, например ${PHONE_EXAMPLE}`,
  PASSWORD_REQUIRED: 'Введите пароль',
  TERMS_REQUIRED: 'Подтвердите согласие, чтобы создать аккаунт',
} as const;
