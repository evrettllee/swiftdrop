import {
  acceptedOfferSchema,
  COURIER_OFFERS_API_PATHS,
  type CourierOffer,
  currentOfferSchema,
  http,
} from '@/shared/api';

// The open offer of the courier, or null.
export async function getCurrentOffer(signal?: AbortSignal): Promise<CourierOffer | null> {
  const { offer } = currentOfferSchema.parse(
    await http.get(COURIER_OFFERS_API_PATHS.CURRENT, { signal }),
  );

  return offer;
}

// The order of the offer becomes the courier's.
export async function acceptOffer(offerId: number): Promise<number> {
  const { orderId } = acceptedOfferSchema.parse(
    await http.post(COURIER_OFFERS_API_PATHS.accept(offerId)),
  );

  return orderId;
}

export async function declineOffer(offerId: number): Promise<void> {
  await http.post(COURIER_OFFERS_API_PATHS.decline(offerId));
}
