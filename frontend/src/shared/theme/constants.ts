export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const THEME_STORAGE_KEY = 'swiftdrop-theme';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEME_TEXTS = {
  SWITCH_TO_DARK: 'Включить тёмную тему',
  SWITCH_TO_LIGHT: 'Включить светлую тему',
} as const;
