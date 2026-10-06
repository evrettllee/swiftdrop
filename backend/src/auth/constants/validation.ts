export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_LOGIN_MIN_LENGTH = 1;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

export const PASSWORD_UPPERCASE_REGEX = /[A-ZА-ЯЁ]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-zа-яё]/;
export const PASSWORD_DIGIT_REGEX = /\d/;
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-zА-Яа-яЁё\d\s]/;
// Letters of any alphabet with diacritics; parts are joined by one space, hyphen or apostrophe.
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '’-]\p{L}[\p{L}\p{M}]*)*$/u;
export const PHONE_REGEX =new RegExp(`^\\+\\d{${PHONE_MIN_DIGITS},${PHONE_MAX_DIGITS}}$`);
export const PHONE_SEPARATORS_REGEX = /[\s\-()]/g;
export const PHONE_SEPARATOR_REPLACEMENT = '';

export const AUTH_VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Введите корректный email',
  EMAIL_TOO_LONG: `Email должен содержать не больше ${EMAIL_MAX_LENGTH} символов`,
  FIRST_NAME_TOO_SHORT: `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа`,
  FIRST_NAME_TOO_LONG: `Имя должно содержать не больше ${NAME_MAX_LENGTH} символов`,
  FIRST_NAME_INVALID: 'Имя может содержать только буквы, пробел, дефис и апостроф',
  LAST_NAME_TOO_SHORT: `Фамилия должна содержать минимум ${NAME_MIN_LENGTH} символа`,
  LAST_NAME_TOO_LONG: `Фамилия должна содержать не больше ${NAME_MAX_LENGTH} символов`,
  LAST_NAME_INVALID: 'Фамилия может содержать только буквы, пробел, дефис и апостроф',
  PHONE_INVALID: 'Введите телефон в международном формате, например +375291234567',
  PASSWORD_TOO_SHORT: `Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов`,
  PASSWORD_TOO_LONG: `Пароль должен содержать не больше ${PASSWORD_MAX_LENGTH} символов`,
  PASSWORD_NO_UPPERCASE: 'Пароль должен содержать заглавную букву',
  PASSWORD_NO_LOWERCASE: 'Пароль должен содержать строчную букву',
  PASSWORD_NO_DIGIT: 'Пароль должен содержать хотя бы одну цифру',
  PASSWORD_NO_SPECIAL: 'Пароль должен содержать спецсимвол, например ! ? #',
  PASSWORD_REQUIRED: 'Введите пароль',
} as const;
