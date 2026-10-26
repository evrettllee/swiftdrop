import { useEffect } from 'react';
import { z } from 'zod';
import { refreshCourierProfile } from '@/entities/courier';
import { courierOfferSchema } from '@/shared/api';
import {
  CONNECTION_STATUS,
  SOCKET_EVENTS,
  onSocketEvent,
  useConnectionStatus,
} from '@/shared/realtime';
import { getCurrentOffer } from '../api/offers';
import { OFFER_NOTICE } from '../config/offer';
import { closeOfferWithNotice, resetOffer, showOffer, useOfferStore } from './offer-store';

const offerClosedSchema = z.object({ offerId: z.number() });

// The offer the backend has now. An offer that came while the socket was down is shown, and the
// shown one that was closed meanwhile is closed.
async function loadCurrentOffer(signal: AbortSignal): Promise<void> {
  try {
    const offer = await getCurrentOffer(signal);
    const shown = useOfferStore.getState().offer;

    if (offer !== null) {
      showOffer(offer);
    } else if (shown !== null) {
      closeOfferWithNotice(shown.offerId, OFFER_NOTICE.TAKEN);
    }
  } catch {
    // The next connection asks again; offer:new still brings new offers.
  }
}

// Keeps the offer in step with the backend while the cabinet is open.
export function useOfferSync(): void {
  const connection = useConnectionStatus();

  useEffect(() => {
    const unsubscribers = [
      onSocketEvent(SOCKET_EVENTS.OFFER_NEW, (payload) => {
        const parsed = courierOfferSchema.safeParse(payload);

        if (parsed.success) {
          showOffer(parsed.data);
        }
      }),
      onSocketEvent(SOCKET_EVENTS.OFFER_CLOSED, (payload) => {
        const parsed = offerClosedSchema.safeParse(payload);

        if (parsed.success) {
          closeOfferWithNotice(parsed.data.offerId, OFFER_NOTICE.TAKEN);
        }
      }),
      // The active order of the courier is gone.
      onSocketEvent(SOCKET_EVENTS.ORDER_CANCELLED, () => {
        void refreshCourierProfile();
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resetOffer();
    };
  }, []);

  // On opening the cabinet (the first connection) and after every reconnection.
  useEffect(() => {
    if (connection !== CONNECTION_STATUS.CONNECTED) {
      return undefined;
    }

    const controller = new AbortController();
    void loadCurrentOffer(controller.signal);

    return () => controller.abort();
  }, [connection]);
}
