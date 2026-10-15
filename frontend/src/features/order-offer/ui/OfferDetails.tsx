import { WarningIcon } from '@phosphor-icons/react';
import { useCourierPosition } from '@/entities/courier';
import {
  formatAreaAddress,
  formatFullAddress,
  formatParcelSize,
  formatParcelWeight,
} from '@/entities/order';
import type { CourierOffer } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT, ROUTE_POINT } from '@/shared/config';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
import { OFFER_TEXTS } from '../config/texts';
import { formatEtaMinutes, formatToPickup } from '../lib/offer-format';
import { OfferMap } from './OfferMap';

type OfferDetailsProps = {
  offer: CourierOffer;
};

// What the courier decides on: the time, the map, the two points and the parcel.
export function OfferDetails({ offer }: OfferDetailsProps) {
  const position = useCourierPosition();
  const { pickup, delivery, parcel } = offer;

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <p className="flex min-w-0 flex-col">
          <span className="text-heading-md font-bold tabular-nums">
            {formatEtaMinutes(offer.pickupEtaSec)}
          </span>
          <span className="text-small text-fg-secondary tabular-nums">
            {formatToPickup(position, pickup)}
          </span>
        </p>
        <p className="flex min-w-0 flex-col">
          <span className="text-heading-md font-bold tabular-nums">
            {formatEtaMinutes(offer.totalEtaSec)}
          </span>
          <span className="text-small text-fg-secondary">{OFFER_TEXTS.WHOLE_ORDER}</span>
        </p>
      </div>
      <OfferMap offer={offer} />
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <RoutePointMark kind={ROUTE_POINT.PICKUP} className="mt-2" />
          <p className="flex min-w-0 flex-col">
            <span className="text-small text-fg-secondary">{OFFER_TEXTS.PICKUP}</span>
            <span>{formatFullAddress(pickup)}</span>
          </p>
        </div>
        <div className="flex items-start gap-3">
          <RoutePointMark kind={ROUTE_POINT.DELIVERY} className="mt-2" />
          <p className="flex min-w-0 flex-col">
            <span className="text-small text-fg-secondary">{OFFER_TEXTS.DELIVERY}</span>
            <span>{formatAreaAddress(delivery)}</span>
            <span className="text-caption text-fg-secondary">{OFFER_TEXTS.DELIVERY_HINT}</span>
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col">
          <dt className="text-small text-fg-secondary">{OFFER_TEXTS.WEIGHT}</dt>
          <dd className="font-semibold tabular-nums">{formatParcelWeight(parcel)}</dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-small text-fg-secondary">{OFFER_TEXTS.SIZE}</dt>
          <dd className="font-semibold tabular-nums">{formatParcelSize(parcel)}</dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-small text-fg-secondary">{OFFER_TEXTS.FRAGILE}</dt>
          {parcel.isFragile ? (
            <dd className="flex items-center gap-1 font-semibold text-warning">
              <WarningIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
              {OFFER_TEXTS.YES}
            </dd>
          ) : (
            <dd className="font-semibold">{OFFER_TEXTS.NO}</dd>
          )}
        </div>
      </dl>
    </>
  );
}
