import { refreshCourierProfile } from '@/entities/courier';
import { ApiError, getApiErrorMessage, HTTP_STATUS } from '@/shared/api';
import { acceptOffer, declineOffer } from '../api/offers';
import { OFFER_NOTICE, OFFER_RESPONSE, type OfferResponse } from '../config/offer';
import { OFFER_TEXTS } from '../config/texts';
import { closeOffer, useOfferStore } from './offer-store';

// The offer is closed or is not the courier's any more (409, 404): nothing to retry.
function isOfferGone(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === HTTP_STATUS.CONFLICT || error.status === HTTP_STATUS.NOT_FOUND)
  );
}

// Sends the answer unless another one is on its way; false when the offer is still open after it.
async function respond(
  offerId: number,
  response: OfferResponse,
  send: () => Promise<unknown>,
): Promise<boolean> {
  const state = useOfferStore.getState();

  if (state.offer?.offerId !== offerId || state.response !== null) {
    return false;
  }

  useOfferStore.setState({ response, error: null });

  try {
    await send();
    closeOffer(null);

    return true;
  } catch (error) {
    if (isOfferGone(error)) {
      // A declined offer that was closed anyway is just closed.
      closeOffer(response === OFFER_RESPONSE.ACCEPT ? OFFER_NOTICE.TAKEN : null);
    } else {
      useOfferStore.setState({
        response: null,
        error: getApiErrorMessage(error, OFFER_TEXTS.RESPONSE_FAILED),
      });
    }

    return false;
  }
}

// True when the order is the courier's: the profile already knows it as the active order.
export async function acceptCurrentOffer(offerId: number): Promise<boolean> {
  const isAccepted = await respond(offerId, OFFER_RESPONSE.ACCEPT, () => acceptOffer(offerId));

  if (isAccepted) {
    await refreshCourierProfile();
  }

  return isAccepted;
}

export async function declineCurrentOffer(offerId: number): Promise<void> {
  await respond(offerId, OFFER_RESPONSE.DECLINE, () => declineOffer(offerId));
}
