import { API_BASE_PATH, AUTH_API_PATHS, CHECKBOX_UNCHECKED_VALUE } from '../../shared/constants';

// Roles: must match the backend role names.
export const ROLE_VALUES = ['client', 'courier', 'manager', 'admin'] as const;

export const ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const satisfies Record<string, (typeof ROLE_VALUES)[number]>;

// Session state
export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  GUEST: 'guest',
} as const;

// Tabs of the auth page
export const AUTH_TAB = {
  LOGIN: 'login',
  REGISTER: 'register',
} as const;

// OAuth: a full-page navigation, not an API call, so the base path is included.
export const OAUTH_START_URLS = {
  google: `${API_BASE_PATH}${AUTH_API_PATHS.GOOGLE}`,
  yandex: `${API_BASE_PATH}${AUTH_API_PATHS.YANDEX}`,
} as const;

// Provider marks keep their brand colors: the only colors outside the design system tokens.
export const YANDEX_BRAND_COLOR = '#FC3F1D';
export const YANDEX_MARK_TEXT_COLOR = '#FFFFFF';
export const YANDEX_MARK_LETTER = 'Я';

export const GOOGLE_BRAND_COLORS = {
  BLUE: '#4285F4',
  GREEN: '#34A853',
  YELLOW: '#FBBC05',
  RED: '#EA4335',
} as const;

// The backend redirects here after a failed provider login: /auth?error=<code>
export const AUTH_ERROR_QUERY_PARAM = 'error';

export const AUTH_ERROR_CODES = {
  OAUTH_FAILED: 'oauth_failed',
  ACCOUNT_BLOCKED: 'account_blocked',
} as const;

// Title and explanation of the alert above the form, by error code.
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.OAUTH_FAILED]: 'Не удалось войти через сервис',
  [AUTH_ERROR_CODES.ACCOUNT_BLOCKED]: 'Аккаунт заблокирован',
};

export const AUTH_ERROR_HINTS: Record<string, string> = {
  [AUTH_ERROR_CODES.OAUTH_FAILED]: 'Попробуйте ещё раз или войдите по email и паролю.',
  [AUTH_ERROR_CODES.ACCOUNT_BLOCKED]: 'Обратитесь в поддержку SwiftDrop, чтобы выяснить причину.',
};

// Validation limits: must match backend/src/auth/auth.constants.ts
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

export const PASSWORD_UPPERCASE_REGEX = /[A-ZА-ЯЁ]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-zа-яё]/;
export const PASSWORD_DIGIT_REGEX = /\d/;
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-zА-Яа-яЁё\d\s]/;
export const PHONE_REGEX = new RegExp(`^\\+\\d{${PHONE_MIN_DIGITS},${PHONE_MAX_DIGITS}}$`);
export const PHONE_SEPARATORS_REGEX = /[\s\-()]/g;
export const PHONE_SEPARATOR_REPLACEMENT = '';

export const EMAIL_EXAMPLE = 'name@example.com';
export const PHONE_EXAMPLE = '+375 29 123-45-67';

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Введите email',
  EMAIL_INVALID: `Введите email полностью, например ${EMAIL_EXAMPLE}`,
  EMAIL_TOO_LONG: `Email должен содержать не больше ${EMAIL_MAX_LENGTH} символов`,
  FIRST_NAME_REQUIRED: 'Введите имя',
  FIRST_NAME_TOO_SHORT: `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа`,
  FIRST_NAME_TOO_LONG: `Имя должно содержать не больше ${NAME_MAX_LENGTH} символов`,
  LAST_NAME_REQUIRED: 'Введите фамилию',
  LAST_NAME_TOO_SHORT: `Фамилия должна содержать минимум ${NAME_MIN_LENGTH} символа`,
  LAST_NAME_TOO_LONG: `Фамилия должна содержать не больше ${NAME_MAX_LENGTH} символов`,
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

// Interface texts
export const AUTH_TEXTS = {
  BACK_HOME: 'На главную',
  TABS_LABEL: 'Вход или регистрация',
  TAB_LOGIN: 'Вход',
  TAB_REGISTER: 'Регистрация',
  TITLE_LOGIN: 'Вход в аккаунт',
  TITLE_REGISTER: 'Создание аккаунта',
  SUBMIT_LOGIN: 'Войти',
  SUBMIT_REGISTER: 'Создать аккаунт',
  SUBMITTING_LOGIN: 'Входим',
  SUBMITTING_REGISTER: 'Создаём аккаунт',
  OR: 'или',
  OAUTH_GOOGLE: 'Продолжить через Google',
  OAUTH_YANDEX: 'Продолжить через Яндекс',
  OAUTH_CONSENT: 'Продолжая через сервис, вы принимаете',
  LABEL_EMAIL: 'Email',
  LABEL_PASSWORD: 'Пароль',
  LABEL_CONFIRM_PASSWORD: 'Повторите пароль',
  LABEL_FIRST_NAME: 'Имя',
  LABEL_LAST_NAME: 'Фамилия',
  LABEL_PHONE: 'Телефон',
  PLACEHOLDER_EMAIL: EMAIL_EXAMPLE,
  PLACEHOLDER_FIRST_NAME: 'Иван',
  PLACEHOLDER_LAST_NAME: 'Петров',
  PLACEHOLDER_PHONE: PHONE_EXAMPLE,
  PHONE_HINT: `В международном формате, например ${PHONE_EXAMPLE}`,
  SHOW_PASSWORD: 'Показать пароль',
  HIDE_PASSWORD: 'Скрыть пароль',
  FORGOT_PASSWORD: 'Забыли пароль?',
  PASSWORD_REQUIREMENTS: 'Пароль должен содержать:',
  STRENGTH: 'Надёжность пароля',
  RULE_MET: 'выполнено',
  RULE_NOT_MET: 'не выполнено',
  TERMS_ACCEPT: 'Я принимаю',
  TERMS_LINK: 'условия использования',
  PRIVACY_LINK: 'политику конфиденциальности',
  AND: 'и',
} as const;

// Initial values of the forms; every value is a string, a checkbox is '' or 'true'.
export const LOGIN_INITIAL_VALUES = {
  email: '',
  password: '',
};

export const REGISTER_INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  terms: CHECKBOX_UNCHECKED_VALUE,
};

// Prefix of the ids that link the tabs and their panels.
export const AUTH_ID_PREFIX = 'auth';
