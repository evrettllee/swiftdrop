import { useLayoutEffect } from 'react';
import { useCourierProfileLoader } from '@/entities/courier';
import { OrderOffer } from '@/features/order-offer';
import { connectCourierSocket, disconnectCourierSocket } from '@/shared/realtime';
import { APP_ROUTES } from '@/shared/routes';
import { AccountShell } from '../account-shell/AccountShell';
import { CourierStatusIndicator } from './CourierStatusIndicator';
import { COURIER_LAYOUT_TEXTS, COURIER_NAV_ITEMS } from './navigation';

// The socket lives while the cabinet is open: leaving it or signing out (the role route unmounts
// the cabinet) closes the socket. A layout effect, so the status never shows the closed socket of
// the previous visit.
function useCourierSocket(): void {
  useLayoutEffect(() => {
    connectCourierSocket();

    return disconnectCourierSocket;
  }, []);
}

// The frame of every page of the courier; an offer of an order may come on any of them.
export function CourierLayout() {
  useCourierSocket();
  useCourierProfileLoader();

  return (
    <>
      <AccountShell
        homeTo={APP_ROUTES.COURIER_WORK}
        navLabel={COURIER_LAYOUT_TEXTS.NAV_LABEL}
        navItems={COURIER_NAV_ITEMS}
        headerEnd={<CourierStatusIndicator />}
      />
      <OrderOffer />
    </>
  );
}
