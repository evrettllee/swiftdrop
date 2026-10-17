// Hover and press colors of the controls: no animation when the user asks for less motion.
export const COLOR_TRANSITION_CLASS =
  'transition-colors duration-150 ease-in-out motion-reduce:transition-none';

// A page with a side column of 25rem (w-100): the main column takes the rest. The one place of the
// width of that column for every such page; a phone has one column.
export const SIDE_COLUMN_LAYOUT_CLASS = 'flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12';
export const MAIN_COLUMN_CLASS = 'min-w-0 lg:flex-1';
export const SIDE_COLUMN_CLASS = 'lg:w-100 lg:shrink-0';

// Icons: one set and one weight for the whole app, so every icon size comes from this scale.
export const ICON_WEIGHT = 'light' as const;
export const ICON_SIZE = {
  SMALL: 16,
  MEDIUM: 20,
  LARGE: 24,
  XLARGE: 32,
} as const;
