export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const THEME_STORAGE_KEY = 'swiftdrop-theme';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export type Theme = (typeof THEME)[keyof typeof THEME];

export type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
};
