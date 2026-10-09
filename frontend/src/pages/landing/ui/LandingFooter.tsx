import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { UI_TEXTS } from '@/shared/config';
import { Logo } from '@/shared/ui/logo';
import { LANDING_CONTAINER_CLASS } from '../config/layout';
import { LANDING_FOOTER_GROUPS, LANDING_SECTION_ID } from '../config/navigation';
import { LANDING_TEXTS } from '../config/texts';
import { useOrderLink } from '../model/useOrderLink';

const LINK_CLASS = 'text-fg-secondary transition-colors duration-150 hover:text-fg';
const HIDDEN_ON_MOBILE_CLASS = 'hidden lg:block';

// The year does not change while the page is open, so it is read once.
const CURRENT_YEAR = new Date().getFullYear();

export function LandingFooter() {
  const orderLink = useOrderLink();

  return (
    <footer className="border-t border-border bg-surface">
      <div
        className={`${LANDING_CONTAINER_CLASS} flex flex-col gap-6 py-8 text-small lg:gap-12 lg:pt-12 lg:pb-8`}
      >
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="flex flex-col gap-6 lg:col-span-5 lg:gap-4">
            <a
              href={`#${LANDING_SECTION_ID.TOP}`}
              aria-label={UI_TEXTS.LOGO_LABEL}
              className="self-start rounded-sm"
            >
              <Logo />
            </a>
            <p className="max-w-80 text-fg-secondary">{LANDING_TEXTS.FOOTER_TAGLINE}</p>
          </div>
          {/* On mobile the groups dissolve into one list, on desktop they become columns. */}
          <div className="flex flex-col gap-4 lg:contents">
            {LANDING_FOOTER_GROUPS.map((group, index) => (
              <div
                key={group.title}
                className={`contents lg:col-span-2 lg:flex lg:flex-col lg:gap-4 ${index === 0 ? 'lg:col-start-7' : ''}`}
              >
                <p className="hidden font-semibold lg:block">{group.title}</p>
                {group.links.map((link) => {
                  const className = link.showOnMobile
                    ? LINK_CLASS
                    : `${HIDDEN_ON_MOBILE_CLASS} ${LINK_CLASS}`;
                  let item: ReactNode;

                  if (link.startsOrder === true) {
                    item = (
                      <Link
                        key={link.label}
                        to={orderLink.to}
                        onClick={() => orderLink.startOrder()}
                        className={className}
                      >
                        {link.label}
                      </Link>
                    );
                  } else if (link.anchor === undefined) {
                    item = (
                      <Link key={link.label} to={link.route} className={className}>
                        {link.label}
                      </Link>
                    );
                  } else {
                    item = (
                      <a key={link.label} href={`#${link.anchor}`} className={className}>
                        {link.label}
                      </a>
                    );
                  }

                  return item;
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="text-fg-secondary">
          {LANDING_TEXTS.COPYRIGHT_SIGN} {CURRENT_YEAR} {LANDING_TEXTS.COPYRIGHT_OWNER}
        </p>
      </div>
    </footer>
  );
}
