import { useAssignmentSync } from '../model/useAssignmentSync';
import { useOfferSync } from '../model/useOfferSync';
import { OfferWindow } from './OfferWindow';

// Offers of orders to the courier, on every page of the cabinet.
export function OrderOffer() {
  useOfferSync();
  useAssignmentSync();

  return <OfferWindow />;
}
