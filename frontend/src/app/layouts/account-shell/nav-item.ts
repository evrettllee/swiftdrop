import type { Icon } from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';

// Where the menu is shown: the sidebar of the desktop or the bottom navigation of a phone.
export const NAV_VARIANT = {
  SIDEBAR: 'sidebar',
  BOTTOM: 'bottom',
} as const;

export type NavVariant = (typeof NAV_VARIANT)[keyof typeof NAV_VARIANT];

export type NavBadge = {
  count: number;
  label: string;
};

export type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  // The item is active only on its own address, not on the pages below it.
  isExact: boolean;
  // Other pages the item stands for, for example a step the courier must pass before the work.
  alsoActiveOn?: readonly string[];
  badge?: NavBadge;
};

const VARIANT_CLASSES: Record<NavVariant, string> = {
  sidebar: 'h-11 flex-row justify-start gap-3 rounded-md px-3 text-body',
  bottom: 'h-16 flex-col justify-center text-caption',
};

const ACTIVE_CLASS = 'bg-selected text-accent';

const IDLE_CLASSES: Record<NavVariant, string> = {
  sidebar: 'text-fg hover:bg-surface-muted',
  bottom: 'text-fg-secondary',
};

export function getNavItemClass(variant: NavVariant, isCurrent: boolean): string {
  return `flex items-center ${COLOR_TRANSITION_CLASS} ${VARIANT_CLASSES[variant]} ${isCurrent ? ACTIVE_CLASS : IDLE_CLASSES[variant]}`;
}
