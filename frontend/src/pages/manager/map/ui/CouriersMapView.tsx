import { createElement, type ReactNode, useCallback } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { MapAnchoredPanel, MarkersMap, PinMarker } from '@/shared/ui/route-map';
import type { GeoPoint } from '@/shared/lib/geo';
import { CARD_TEXTS, MANAGER_MAP_TEXTS as TEXTS, markerLabel } from '../config/texts';
import type { LiveCourier } from '../lib/courier-state';
import { pinTone, stateLabel } from '../lib/courier-view';
import { vehicleIcon } from '../lib/vehicle';
import { MapLegend } from './MapLegend';

const PANEL_CLASS =
  'w-80 rounded-lg border border-transparent bg-surface p-4 text-fg shadow-lg dark:border-border';

function pointOf({ lat, lng }: LiveCourier): GeoPoint | null {
  return lat === null || lng === null ? null : { latitude: lat, longitude: lng };
}

type CourierPinProps = {
  courier: LiveCourier;
  point: GeoPoint;
  isSelected: boolean;
  onSelect: (courierId: number) => void;
};

function CourierPin({ courier, point, isSelected, onSelect }: CourierPinProps) {
  const { courierId } = courier;
  const select = useCallback(() => onSelect(courierId), [onSelect, courierId]);

  return (
    <PinMarker
      point={point}
      tone={pinTone(courier.state)}
      isSelected={isSelected}
      label={markerLabel(courier.name, stateLabel(courier.state))}
      icon={createElement(vehicleIcon(courier.vehicleType), {
        size: ICON_SIZE.MEDIUM,
        weight: ICON_WEIGHT,
      })}
      onSelect={select}
    />
  );
}

type CouriersMapViewProps = {
  couriers: readonly LiveCourier[];
  fitPoints: readonly GeoPoint[];
  selected: LiveCourier | null;
  card: ReactNode;
  className: string;
  onSelect: (courierId: number) => void;
};

export function CouriersMapView({
  couriers,
  fitPoints,
  selected,
  card,
  className,
  onSelect,
}: CouriersMapViewProps) {
  const selectedPoint = selected === null ? null : pointOf(selected);

  return (
    <MarkersMap
      label={TEXTS.MAP_LABEL}
      fitPoints={fitPoints}
      overlay={<MapLegend />}
      className={className}
    >
      {couriers.map((courier) => {
        const point = pointOf(courier);

        return point === null ? null : (
          <CourierPin
            key={courier.courierId}
            courier={courier}
            point={point}
            isSelected={courier.courierId === selected?.courierId}
            onSelect={onSelect}
          />
        );
      })}
      {card === null || selected === null || selectedPoint === null ? null : (
        <MapAnchoredPanel
          point={selectedPoint}
          label={CARD_TEXTS.courierLabel(selected.name)}
          className={PANEL_CLASS}
        >
          {card}
        </MapAnchoredPanel>
      )}
    </MarkersMap>
  );
}
