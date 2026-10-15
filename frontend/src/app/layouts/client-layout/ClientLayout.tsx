import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { MAIN_CONTENT_ID } from '@/shared/config';
import { ContentLoader } from '@/shared/ui/page-loader';
import { SkipLink } from '@/shared/ui/skip-link';
import { ClientBottomNav } from './ClientBottomNav';
import { ClientMobileHeader } from './ClientMobileHeader';
import { ClientSidebar } from './ClientSidebar';

// The frame of every page of the client: the sidebar on the desktop, the top bar and the
// bottom navigation on a phone. A page loads inside the frame, so the menu never disappears.
// The page fills the width next to the menu, with the same 48px margin on the desktop.
export function ClientLayout() {
  return (
    <div className="flex min-h-dvh">
      <SkipLink />
      <ClientSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ClientMobileHeader />
        {/* A column, so that a loader of a page can fill the space between the header and the
            bottom navigation (flex-1) and stand in its center. */}
        <main id={MAIN_CONTENT_ID} className="flex flex-1 flex-col px-4 pt-4 pb-24 lg:p-12">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ClientBottomNav />
    </div>
  );
}
