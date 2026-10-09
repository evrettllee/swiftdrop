import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { MAIN_CONTENT_ID } from '@/shared/config';
import { SkipLink } from '@/shared/ui/skip-link';
import { Spinner } from '@/shared/ui/spinner';
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
        <main id={MAIN_CONTENT_ID} className="flex-1 px-4 pt-4 pb-24 lg:p-12">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ClientBottomNav />
    </div>
  );
}
