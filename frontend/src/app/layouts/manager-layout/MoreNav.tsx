import { ListIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { matchPath, useLocation } from 'react-router';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Sheet } from '@/shared/ui/dialog';
import { getNavItemClass, NAV_VARIANT } from '../account-shell/nav-item';
import { NavItemLink } from '../account-shell/NavItemLink';
import { MANAGER_LAYOUT_TEXTS, MORE_NAV_ITEMS } from './navigation';

export function MoreNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const isCurrent = MORE_NAV_ITEMS.some(
    ({ to, isExact }) => matchPath({ path: to, end: isExact }, pathname) !== null,
  );
  const close = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={getNavItemClass(NAV_VARIANT.BOTTOM, isCurrent)}
      >
        <ListIcon size={ICON_SIZE.LARGE} weight={ICON_WEIGHT} aria-hidden="true" />
        {MANAGER_LAYOUT_TEXTS.NAV_MORE}
      </button>
      <Sheet isOpen={isOpen} onClose={close} title={MANAGER_LAYOUT_TEXTS.NAV_MORE}>
        <nav aria-label={MANAGER_LAYOUT_TEXTS.NAV_MORE} className="flex flex-col gap-1">
          {MORE_NAV_ITEMS.map((item) => (
            <NavItemLink key={item.to} {...item} variant={NAV_VARIANT.SIDEBAR} onClick={close} />
          ))}
        </nav>
      </Sheet>
    </>
  );
}
