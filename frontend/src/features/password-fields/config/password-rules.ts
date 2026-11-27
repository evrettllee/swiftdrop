export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_UPPERCASE_REGEX = /[A-ZА-ЯЁ]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-zа-яё]/;
export const PASSWORD_DIGIT_REGEX = /\d/;
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-zА-Яа-яЁё\d\s]/;

export const PASSWORD_MESSAGES = {
  REQUIRED: 'Введите пароль',
  TOO_LONG: `Пароль должен содержать не больше ${PASSWORD_MAX_LENGTH} символов`,
  WEAK: 'Пароль не соответствует требованиям',
  CONFIRM_REQUIRED: 'Повторите пароль',
  MISMATCH: 'Пароли не совпадают',
} as const;

export const PASSWORD_TEXTS = {
  LABEL: 'Пароль',
  LABEL_CONFIRM: 'Повторите пароль',
  SHOW: 'Показать пароль',
  HIDE: 'Скрыть пароль',
  REQUIREMENTS: 'Пароль должен содержать:',
  STRENGTH: 'Надёжность пароля',
  RULE_MET: 'выполнено',
  RULE_NOT_MET: 'не выполнено',
} as const;

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

export const STRENGTH_LABELS = ['Слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'] as const;
