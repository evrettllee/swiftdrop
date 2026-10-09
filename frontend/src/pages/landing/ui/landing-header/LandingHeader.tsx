import { ListIcon, XIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT, UI_TEXTS } from '@/shared/config';
import { subscribeToMediaQuery, useEscapeKey } from '@/shared/lib/dom';
import { IconButton } from '@/shared/ui/icon-button';
import { Logo } from '@/shared/ui/logo';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import {
  LANDING_CONTAINER_CLASS,
  LANDING_DESKTOP_MEDIA_QUERY,
  LANDING_HEADER_HEIGHT_CLASS,
  LANDING_MOBILE_MENU_ID,
} from '../../config/layout';
import { LANDING_NAV_ITEMS, LANDING_SECTION_ID } from '../../config/navigation';
import { LANDING_TEXTS } from '../../config/texts';
import { AuthActions } from './AuthActions';
import { MobileMenu } from './MobileMenu';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  // The menu exists only on narrow screens, so it must not stay open after the window grows.
  useEffect(
    () =>
      subscribeToMediaQuery(LANDING_DESKTOP_MEDIA_QUERY, (isDesktop) => {
        if (isDesktop) {
          setIsMenuOpen(false);
        }
      }),
    [],
  );

  useEscapeKey(closeMenu, isMenuOpen);

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
        <div
          className={`${LANDING_CONTAINER_CLASS} ${LANDING_HEADER_HEIGHT_CLASS} flex items-center gap-8`}
        >
          <a
            href={`#${LANDING_SECTION_ID.TOP}`}
            aria-label={UI_TEXTS.LOGO_LABEL}
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
                className={`rounded-md px-2 py-2.5 text-body whitespace-nowrap text-fg hover:bg-selected active:bg-border ${COLOR_TRANSITION_CLASS}`}
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
            <IconButton
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={menuLabel}
              aria-expanded={isMenuOpen}
              aria-controls={isMenuOpen ? LANDING_MOBILE_MENU_ID : undefined}
              className="lg:hidden"
            >
              <MenuIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        {isMenuOpen ? <MobileMenu onNavigate={closeMenu} /> : null}
      </header>
    </>
  );
}
