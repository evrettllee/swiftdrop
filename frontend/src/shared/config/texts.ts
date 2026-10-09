export const UI_TEXTS = {
  LOADING: 'Загрузка',
  SKIP_TO_CONTENT: 'Перейти к основному содержимому',
  LOGO_LABEL: 'SwiftDrop, на главную',
  BACK_HOME: 'На главную',
  SIGN_IN: 'Войти',
  SIGN_UP: 'Регистрация',
  PROFILE: 'Профиль',
  ADDRESSES: 'Адреса',
  EMAIL: 'Email',
  TERMS_TITLE: 'Условия использования',
  PRIVACY_TITLE: 'Политика конфиденциальности',
  CLOSE: 'Закрыть',
} as const;

export const PAGINATION_TEXTS = {
  LABEL: 'Страницы',
  PREVIOUS: 'Предыдущая страница',
  NEXT: 'Следующая страница',
  range: (first: number, last: number, total: number) => `${first}–${last} из ${total}`,
  page: (page: number, totalPages: number) => `Страница ${page} из ${totalPages}`,
} as const;

export const THEME_TEXTS = {
  SWITCH_TO_DARK: 'Включить тёмную тему',
  SWITCH_TO_LIGHT: 'Включить светлую тему',
} as const;
