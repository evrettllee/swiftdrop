import { ListIcon, XIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { ESCAPE_KEY, ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants';
import { Logo } from '../../../shared/ui/Logo';
import { ThemeToggle } from '../../../shared/ui/ThemeToggle';
import {
  LANDING_DESKTOP_MEDIA_QUERY,
  LANDING_MOBILE_MENU_ID,
  LANDING_NAV_ITEMS,
  LANDING_SECTION_ID,
  LANDING_TEXTS,
} from '../constants';
import { AuthActions } from './AuthActions';
import { MobileMenu } from './MobileMenu';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // The menu exists only on narrow screens, so it must not stay open after the window grows.
  useEffect(() => {
    const desktopQuery = window.matchMedia(LANDING_DESKTOP_MEDIA_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };
    desktopQuery.addEventListener('change', closeOnDesktop);
    return () => desktopQuery.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const MenuIcon = isMenuOpen ? XIcon : ListIcon;
  const menuLabel = isMenuOpen ? LANDING_TEXTS.CLOSE_MENU : LANDING_TEXTS.OPEN_MENU;

  return (
    <>
      {/* Dims the page under the open menu; the keyboard closes the menu with Escape. */}
      {isMenuOpen ? (
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className="fixed inset-0 z-10 cursor-default bg-scrim lg:hidden"
        />
      ) : null}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4 lg:h-16 lg:px-12">
          <a
            href={`#${LANDING_SECTION_ID.TOP}`}
            aria-label={LANDING_TEXTS.LOGO_LABEL}
            className="shrink-0 rounded-sm"
          >
            <Logo />
          </a>
          <nav
            aria-label={LANDING_TEXTS.NAV_LABEL}
            className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex"
          >
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-2 py-2.5 text-body whitespace-nowrap text-fg transition-colors duration-150 ease-in-out hover:bg-selected active:bg-border motion-reduce:transition-none"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 lg:flex">
              <AuthActions />
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={menuLabel}
              aria-expanded={isMenuOpen}
              aria-controls={isMenuOpen ? LANDING_MOBILE_MENU_ID : undefined}
              className="flex size-11 items-center justify-center rounded-md text-fg transition-colors duration-150 hover:bg-selected lg:hidden"
            >
              <MenuIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
            </button>
          </div>
        </div>
        {isMenuOpen ? <MobileMenu onNavigate={closeMenu} /> : null}
      </header>
    </>
  );
}
