import { useCourierProfileLoader } from '@/entities/courier';
import { OrderOffer } from '@/features/order-offer';
import { CourierLocationProvider } from '@/features/courier-location';
import { useAppSocket } from '@/shared/realtime';
import { APP_ROUTES } from '@/shared/routes';
import { AccountShell } from '../account-shell/AccountShell';
import { CourierStatusIndicator } from './CourierStatusIndicator';
import { COURIER_LAYOUT_TEXTS, COURIER_NAV_ITEMS } from './navigation';
import { useActiveOrderRoom } from './useActiveOrderRoom';

// The frame of every page of the courier; an offer of an order may come on any of them. The socket
// lives while the cabinet is open: leaving it or signing out (the role route unmounts the cabinet)
// closes it.
export function CourierLayout() {
  useAppSocket();
  useCourierProfileLoader();
  useActiveOrderRoom();

  return (
    <CourierLocationProvider>
      <AccountShell
        homeTo={APP_ROUTES.COURIER_WORK}
        navLabel={COURIER_LAYOUT_TEXTS.NAV_LABEL}
        navItems={COURIER_NAV_ITEMS}
        headerEnd={<CourierStatusIndicator />}
      />
      <OrderOffer />
    </CourierLocationProvider>
  );
}
