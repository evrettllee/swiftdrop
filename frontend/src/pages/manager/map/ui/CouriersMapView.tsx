import { createElement, memo, type ReactNode, useCallback, useMemo } from 'react';
import type { VehicleType } from '@/shared/api';
import type { CourierMapState } from '@/shared/staff-api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { MapAnchoredPanel, MarkersMap, PinMarker } from '@/shared/ui/route-map';
import type { GeoPoint } from '@/shared/lib/geo';
import { CARD_TEXTS, MANAGER_MAP_TEXTS as TEXTS, markerLabel } from '../config/texts';
import { type LiveCourier, pointOf } from '../lib/courier-state';
import { pinTone, stateLabel } from '../lib/courier-view';
import { vehicleIcon } from '../lib/vehicle';
import { MapLegend } from './MapLegend';

const PANEL_CLASS =
  'w-80 rounded-lg border border-transparent bg-surface p-4 text-fg shadow-lg dark:border-border';

type CourierPinProps = {
  courierId: number;
  name: string;
  vehicleType: VehicleType | null;
  state: CourierMapState;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  onSelect: (courierId: number) => void;
};

const CourierPin = memo(function CourierPin({
  courierId,
  name,
  vehicleType,
  state,
  latitude,
  longitude,
  isSelected,
  onSelect,
}: CourierPinProps) {
  const select = useCallback(() => onSelect(courierId), [onSelect, courierId]);
  const point = useMemo<GeoPoint>(() => ({ latitude, longitude }), [latitude, longitude]);

  return (
    <PinMarker
      point={point}
      tone={pinTone(state)}
      isSelected={isSelected}
      label={markerLabel(name, stateLabel(state))}
      icon={createElement(vehicleIcon(vehicleType), {
        size: ICON_SIZE.MEDIUM,
        weight: ICON_WEIGHT,
      })}
      onSelect={select}
    />
  );
});

type CouriersMapViewProps = {
  couriers: readonly LiveCourier[];
  fitPoints: readonly GeoPoint[];
  selected: LiveCourier | null;
  card: ReactNode;
  routeLayer: ReactNode;
  className: string;
  onSelect: (courierId: number) => void;
};

export function CouriersMapView({
  couriers,
  fitPoints,
  selected,
  card,
  routeLayer,
  className,
  onSelect,
}: CouriersMapViewProps) {
  const selectedPoint = pointOf(selected);

  return (
    <MarkersMap
      label={TEXTS.MAP_LABEL}
      fitPoints={fitPoints}
      overlay={<MapLegend />}
      className={className}
    >
      {routeLayer}
      {couriers.map((courier) => {
        const point = pointOf(courier);

        return point === null ? null : (
          <CourierPin
            key={courier.courierId}
            courierId={courier.courierId}
            name={courier.name}
            vehicleType={courier.vehicleType}
            state={courier.state}
            latitude={point.latitude}
            longitude={point.longitude}
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
