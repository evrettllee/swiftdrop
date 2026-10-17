import { useOfferSync } from '../model/useOfferSync';
import { OfferNotice } from './OfferNotice';
import { OfferWindow } from './OfferWindow';

// Offers of orders to the courier, on every page of the cabinet.
export function OrderOffer() {
  useOfferSync();

  return (
    <>
      <OfferWindow />
      <OfferNotice />
    </>
  );
}
