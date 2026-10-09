import { CLIENT_LAYOUT_TEXTS, CLIENT_NAV_ITEMS, NAV_VARIANT } from './navigation';
import { NavItemLink } from './NavItemLink';

// The menu of the phone: on the desktop the sidebar takes its place.
export function ClientBottomNav() {
  return (
    <nav
      aria-label={CLIENT_LAYOUT_TEXTS.NAV_LABEL}
      className="fixed inset-x-0 bottom-0 z-10 grid auto-cols-fr grid-flow-col bg-surface pb-[env(safe-area-inset-bottom)] shadow-up lg:hidden dark:border-t dark:border-border"
    >
      {CLIENT_NAV_ITEMS.map((item) => (
        <NavItemLink key={item.to} {...item} variant={NAV_VARIANT.BOTTOM} />
      ))}
    </nav>
  );
}
