import { APP_ROUTES } from '@/shared/routes';
import { ToastViewport } from '@/shared/ui/toast';
import { AccountShell } from '../account-shell/AccountShell';
import { useSupportReplyToast } from '../account-shell/useSupportReplyToast';
import { CLIENT_BOTTOM_NAV_ITEMS, CLIENT_LAYOUT_TEXTS, CLIENT_NAV_ITEMS } from './navigation';

// The frame of every page of the client.
export function ClientLayout() {
  useSupportReplyToast(APP_ROUTES.SUPPORT);

  return (
    <>
      <AccountShell
        homeTo={APP_ROUTES.HOME}
        navLabel={CLIENT_LAYOUT_TEXTS.NAV_LABEL}
        navItems={CLIENT_NAV_ITEMS}
        bottomNavItems={CLIENT_BOTTOM_NAV_ITEMS}
      />
      <ToastViewport />
    </>
  );
}
