import { type ReactNode, Suspense } from 'react';
import { Outlet, useSearchParams } from 'react-router';
import { MAIN_CONTENT_ID } from '@/shared/config';
import { isChatOpenIn } from '@/shared/routes';
import { ContentLoader } from '@/shared/ui/page-loader';
import { SkipLink } from '@/shared/ui/skip-link';
import { AccountBottomNav } from './AccountBottomNav';
import { AccountMobileHeader } from './AccountMobileHeader';
import { AccountSidebar } from './AccountSidebar';
import type { NavItem } from './nav-item';

type AccountShellProps = {
  // Where the logo leads.
  homeTo: string;
  navLabel: string;
  navItems: readonly NavItem[];
  bottomNavItems?: readonly NavItem[];
  bottomNavEnd?: ReactNode;
  userCaption?: string;
  // Shown at the end of the top bar of the phone.
  headerEnd?: ReactNode;
};

// The frame of every page of an account area: the sidebar on the desktop, the top bar and the
// bottom navigation on a phone. A page loads inside the frame, so the menu never disappears.
// The page fills the width next to the menu, with the same 48px margin on the desktop.
export function AccountShell({
  homeTo,
  navLabel,
  navItems,
  bottomNavItems = navItems,
  bottomNavEnd,
  userCaption,
  headerEnd,
}: AccountShellProps) {
  const [searchParams] = useSearchParams();
  const isChatOpen = isChatOpenIn(searchParams);

  return (
    <div className="flex min-h-dvh">
      <SkipLink />
      <AccountSidebar
        homeTo={homeTo}
        navLabel={navLabel}
        items={navItems}
        userCaption={userCaption}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AccountMobileHeader homeTo={homeTo} end={isChatOpen ? undefined : headerEnd} />
        {/* A column, so that a loader of a page can fill the space between the header and the
            bottom navigation (flex-1) and stand in its center. */}
        <main id={MAIN_CONTENT_ID} className="flex flex-1 flex-col px-4 pt-4 pb-24 lg:p-12">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {isChatOpen ? null : (
        <AccountBottomNav label={navLabel} items={bottomNavItems} end={bottomNavEnd} />
      )}
    </div>
  );
}
