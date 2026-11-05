import { create } from 'zustand';
import type { CourierOffer } from '@/shared/api';
import { hideToast, showToast } from '@/shared/ui/toast';
import {
  OFFER_NOTICE,
  OFFER_NOTICE_MS,
  OFFER_TTL_MS,
  OFFER_VIBRATION_PATTERN,
  type OfferNotice,
  type OfferResponse,
} from '../config/offer';
import { OFFER_NOTICE_TEXTS } from '../config/texts';

const OFFER_TOAST_KEY = 'offer';

type OfferState = {
  // The offer in the window; null when the window is closed.
  offer: CourierOffer | null;
  // When the time to answer is up, by the clock of the device.
  deadline: number;
  // The answer being sent; the buttons wait for it.
  response: OfferResponse | null;
  // Why the last answer was not sent, other than a closed offer.
  error: string | null;
};

const INITIAL_STATE: OfferState = {
  offer: null,
  deadline: 0,
  response: null,
  error: null,
};

// One offer for the whole cabinet: it may come on any page.
export const useOfferStore = create<OfferState>()(() => INITIAL_STATE);

// The clock of the device may differ from the one of the backend: the time left is counted from
// now and kept between 0 and the time an offer has.
function getDeadline(expiresAt: Date, now: number): number {
  return now + Math.min(Math.max(expiresAt.getTime() - now, 0), OFFER_TTL_MS);
}

// A phone in a pocket: a short series, where the device can vibrate. The browser allows it only
// after the person has touched the page.
export function vibrateOffer(): void {
  if ('vibrate' in navigator && navigator.userActivation.hasBeenActive) {
    navigator.vibrate(OFFER_VIBRATION_PATTERN);
  }
}

export function showOffer(offer: CourierOffer): void {
  if (useOfferStore.getState().offer?.offerId === offer.offerId) {
    return;
  }

  useOfferStore.setState({
    offer,
    deadline: getDeadline(offer.expiresAt, Date.now()),
    response: null,
    error: null,
  });
  hideToast(OFFER_TOAST_KEY);
  vibrateOffer();
}

export function dismissOffer(): void {
  const { offer, response } = useOfferStore.getState();

  if (offer !== null && response === null) {
    closeOffer(null);
  }
}

// Closes the window, with a message about why or without one.
export function closeOffer(notice: OfferNotice | null): void {
  useOfferStore.setState({ offer: null, response: null, error: null });

  if (notice === null) {
    hideToast(OFFER_TOAST_KEY);
  } else {
    showToast({
      key: OFFER_TOAST_KEY,
      variant: notice === OFFER_NOTICE.EXPIRED ? 'warning' : 'info',
      title: OFFER_NOTICE_TEXTS[notice].title,
      text: OFFER_NOTICE_TEXTS[notice].text,
      durationMs: OFFER_NOTICE_MS,
    });
  }
}

// The offer was closed by the backend or by its time. An answer being sent decides by itself what
// the courier sees, so it is not interrupted.
export function closeOfferWithNotice(offerId: number, notice: OfferNotice): void {
  const { offer, response } = useOfferStore.getState();

  if (offer?.offerId === offerId && response === null) {
    closeOffer(notice);
  }
}

export function resetOffer(): void {
  useOfferStore.setState(INITIAL_STATE);
  hideToast(OFFER_TOAST_KEY);
}
