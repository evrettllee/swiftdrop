import { lazy, Suspense } from 'react';
import type { CourierOffer } from '@/shared/api';
import { Skeleton } from '@/shared/ui/skeleton';
import { DELIVERY_AREA_RADIUS_M } from '../config/offer';

// Leaflet comes with the first offer, not with the cabinet.
const AreaMap = lazy(() =>
  import('@/shared/ui/route-map').then((module) => ({ default: module.AreaMap })),
);

// The size of the map block, the same for the map and for its placeholder.
const MAP_FRAME_CLASS = 'h-30 lg:h-35';

type OfferMapProps = {
  offer: CourierOffer;
};

export function OfferMap({ offer }: OfferMapProps) {
  return (
    <Suspense fallback={<Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />}>
      <AreaMap
        pickup={offer.pickup}
        areaCenter={offer.delivery}
        areaRadiusM={DELIVERY_AREA_RADIUS_M}
        className={MAP_FRAME_CLASS}
      />
    </Suspense>
  );
}
