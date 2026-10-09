import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, PHONE_EXAMPLE } from '@/shared/lib/person-validation';

// Validation limits: must match backend/src/auth/constants/validation.ts
// Name and phone limits live in shared/lib/person-validation/person-validation.ts
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_UPPERCASE_REGEX = /[A-ZА-ЯЁ]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-zа-яё]/;
export const PASSWORD_DIGIT_REGEX = /\d/;
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-zА-Яа-яЁё\d\s]/;

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
  PASSWORD_TOO_LONG: `Пароль должен содержать не больше ${PASSWORD_MAX_LENGTH} символов`,
  PASSWORD_WEAK: 'Пароль не соответствует требованиям',
  CONFIRM_PASSWORD_REQUIRED: 'Повторите пароль',
  PASSWORDS_MISMATCH: 'Пароли не совпадают',
  TERMS_REQUIRED: 'Подтвердите согласие, чтобы создать аккаунт',
} as const;

// The checklist under the password field; the number of met rules also drives the strength meter.
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `Не менее ${PASSWORD_MIN_LENGTH} символов`,
    isMet: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'letters',
    label: 'Заглавные и строчные буквы',
    isMet: (value: string) =>
      PASSWORD_UPPERCASE_REGEX.test(value) && PASSWORD_LOWERCASE_REGEX.test(value),
  },
  {
    id: 'digit',
    label: 'Хотя бы одна цифра',
    isMet: (value: string) => PASSWORD_DIGIT_REGEX.test(value),
  },
  {
    id: 'special',
    label: 'Спецсимвол, например ! ? #',
    isMet: (value: string) => PASSWORD_SPECIAL_REGEX.test(value),
  },
] as const;

// Indexed by the number of met rules (0 to 4).
export const STRENGTH_LABELS = ['Слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'] as const;
