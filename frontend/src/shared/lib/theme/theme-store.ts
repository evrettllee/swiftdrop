import { create } from 'zustand';
import { matchesMediaQuery, subscribeToMediaQuery } from '@/shared/lib/dom';
import { DARK_SCHEME_QUERY, THEME, type Theme, THEME_STORAGE_KEY, type ThemeState } from './theme';

function isTheme(value: unknown): value is Theme {
  return value === THEME.LIGHT || value === THEME.DARK;
}

function themeFromScheme(isDark: boolean): Theme {
  return isDark ? THEME.DARK : THEME.LIGHT;
}

function readStoredTheme(): Theme | null {
  let theme: Theme | null = null;

  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);

    if (isTheme(value)) {
      theme = value;
    }
  } catch {
    // Storage can be blocked (private mode), then the system theme is used.
  }

  return theme;
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The choice just will not be remembered.
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

// The inline script in index.html has already set the attribute before the app starts.
function readAppliedTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  let theme: Theme;

  if (isTheme(applied)) {
    theme = applied;
  } else {
    theme = readStoredTheme() ?? themeFromScheme(matchesMediaQuery(DARK_SCHEME_QUERY));
  }

  return theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readAppliedTheme(),

  toggleTheme: () => {
    const next = get().theme === THEME.DARK ? THEME.LIGHT : THEME.DARK;

    applyTheme(next);
    writeStoredTheme(next);
    set({ theme: next });
  },
}));

// Follows the system theme until the user makes an explicit choice.
export function initTheme(): void {
  subscribeToMediaQuery(DARK_SCHEME_QUERY, (isDark) => {
    if (readStoredTheme() !== null) {
      return;
    }

    const theme = themeFromScheme(isDark);

    applyTheme(theme);
    useThemeStore.setState({ theme });
  });
}
