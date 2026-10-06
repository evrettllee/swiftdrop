import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../constants';
import { THEME, THEME_TEXTS } from '../theme/constants';
import { useThemeStore } from '../theme/store';
import { IconButton } from './IconButton';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === THEME.DARK;
  const label = isDark ? THEME_TEXTS.SWITCH_TO_LIGHT : THEME_TEXTS.SWITCH_TO_DARK;
  const Icon = isDark ? SunIcon : MoonIcon;

  return (
    <IconButton onClick={toggleTheme} aria-label={label} title={label}>
      <Icon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </IconButton>
  );
}
