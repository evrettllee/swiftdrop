import { NAV_VARIANT, type NavItem } from './nav-item';
import { NavItemLink } from './NavItemLink';

type AccountBottomNavProps = {
  label: string;
  items: readonly NavItem[];
};

// The menu of the phone: on the desktop the sidebar takes its place.
export function AccountBottomNav({ label, items }: AccountBottomNavProps) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-10 grid auto-cols-fr grid-flow-col bg-surface pb-[env(safe-area-inset-bottom)] shadow-up lg:hidden dark:border-t dark:border-border"
    >
      {items.map((item) => (
        <NavItemLink key={item.to} {...item} variant={NAV_VARIANT.BOTTOM} />
      ))}
    </nav>
  );
}
