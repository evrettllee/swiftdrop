import type { Icon } from '@phosphor-icons/react';

// Where the menu is shown: the sidebar of the desktop or the bottom navigation of a phone.
export const NAV_VARIANT = {
  SIDEBAR: 'sidebar',
  BOTTOM: 'bottom',
} as const;

export type NavVariant = (typeof NAV_VARIANT)[keyof typeof NAV_VARIANT];

export type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  // The item is active only on its own address, not on the pages below it.
  isExact: boolean;
  // Other pages the item stands for, for example a step the courier must pass before the work.
  alsoActiveOn?: readonly string[];
};
