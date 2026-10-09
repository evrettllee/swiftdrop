// Hover and press colors of the controls: no animation when the user asks for less motion.
export const COLOR_TRANSITION_CLASS =
  'transition-colors duration-150 ease-in-out motion-reduce:transition-none';

// Icons: one set and one weight for the whole app, so every icon size comes from this scale.
export const ICON_WEIGHT = 'light' as const;
export const ICON_SIZE = {
  SMALL: 16,
  MEDIUM: 20,
  LARGE: 24,
  XLARGE: 32,
} as const;
