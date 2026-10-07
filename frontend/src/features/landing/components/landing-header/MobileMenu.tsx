import { CaretRightIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../../shared/constants/styles';
import { LANDING_MOBILE_MENU_ID } from '../../constants/layout';
import { LANDING_NAV_ITEMS } from '../../constants/navigation';
import { LANDING_TEXTS } from '../../constants/texts';
import { AuthActions } from './AuthActions';

type MobileMenuProps = {
  // Called when a section is chosen: the page scrolls to it and the menu closes.
  onNavigate: () => void;
};

export function MobileMenu({ onNavigate }: MobileMenuProps) {
  return (
    <nav
      id={LANDING_MOBILE_MENU_ID}
      aria-label={LANDING_TEXTS.NAV_LABEL}
      className="absolute inset-x-0 top-full flex flex-col gap-6 border-b border-border bg-surface px-4 pb-6 pt-2 shadow-lg lg:hidden"
    >
      <div className="flex flex-col">
        {LANDING_NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={onNavigate}
            className="flex min-h-14 items-center justify-between border-b border-border text-heading-sm font-semibold"
          >
            {item.label}
            <CaretRightIcon
              size={ICON_SIZE.MEDIUM}
              weight={ICON_WEIGHT}
              aria-hidden="true"
              className="text-fg-muted"
            />
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <AuthActions stacked />
      </div>
    </nav>
  );
}
