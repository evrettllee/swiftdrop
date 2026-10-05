import type { THEME } from './constants';

export type Theme = (typeof THEME)[keyof typeof THEME];

export type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
};
