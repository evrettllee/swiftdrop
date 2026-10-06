import { UI_TEXTS } from '../shared/constants';

// Interface texts of the general pages
export const APP_TEXTS = {
  SIGN_IN: 'Войти',
  SIGN_OUT: 'Выйти',
  PROFILE: 'Профиль',
  PROFILE_EMAIL: 'Email',
  PROFILE_ROLE: 'Роль',
  NOT_FOUND_TITLE: 'Страница не найдена',
  NOT_FOUND_HINT: 'Возможно, ссылка устарела или адрес введён с ошибкой',
} as const;

export const PLACEHOLDER_TEXTS = {
  HINT: 'Страница появится позже',
  FORGOT_PASSWORD_TITLE: 'Восстановление пароля',
  TERMS_TITLE: UI_TEXTS.TERMS_TITLE,
  PRIVACY_TITLE: UI_TEXTS.PRIVACY_TITLE,
} as const;

export const ERROR_TEXTS = {
  FORBIDDEN_TITLE: 'Нет доступа',
  FORBIDDEN_HINT: 'У вашей учётной записи нет прав для просмотра этой страницы',
  GENERIC_TITLE: 'Что-то пошло не так',
  GENERIC_HINT: 'Попробуйте обновить страницу или вернуться позже',
  RELOAD: 'Обновить',
} as const;
