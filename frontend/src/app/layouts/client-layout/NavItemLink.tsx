import type { Icon } from '@phosphor-icons/react';
import { NavLink } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { NavVariant } from './navigation';

const VARIANT_CLASSES: Record<NavVariant, string> = {
  sidebar: 'h-11 flex-row justify-start gap-3 rounded-md px-3 text-body',
  bottom: 'h-16 flex-col justify-center text-caption',
};

const ACTIVE_CLASS = 'bg-selected text-accent';

const IDLE_CLASSES: Record<NavVariant, string> = {
  sidebar: 'text-fg hover:bg-surface-muted',
  bottom: 'text-fg-secondary',
};

type NavItemLinkProps = {
  to: string;
  label: string;
  icon: Icon;
  isExact: boolean;
  variant: NavVariant;
};

export function NavItemLink({ to, label, icon: ItemIcon, isExact, variant }: NavItemLinkProps) {
  return (
    <NavLink
      to={to}
      end={isExact}
      className={({ isActive }) =>
        `flex items-center ${COLOR_TRANSITION_CLASS} ${VARIANT_CLASSES[variant]} ${isActive ? ACTIVE_CLASS : IDLE_CLASSES[variant]}`
      }
    >
      <ItemIcon size={ICON_SIZE.LARGE} weight={ICON_WEIGHT} aria-hidden="true" />
      {label}
    </NavLink>
  );
}
