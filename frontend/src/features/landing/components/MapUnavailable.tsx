import { MapTrifoldIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import { MAP_PLACED_CLASS, MAP_TEXTS } from '../constants/map';

type MapUnavailableProps = {
  // The parent sets the size of the map, so the placeholder fills the same place.
  className: string;
};

// Stands in for the map when it cannot load, so the page does not show an empty gray block.
export function MapUnavailable({ className }: MapUnavailableProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`${MAP_PLACED_CLASS} flex flex-col items-center justify-center gap-2 p-6 text-center text-fg-secondary`}
      >
        <MapTrifoldIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        <p>{MAP_TEXTS.UNAVAILABLE}</p>
        {import.meta.env.DEV ? (
          <p className="text-caption text-fg-muted">{MAP_TEXTS.UNAVAILABLE_DEV_HINT}</p>
        ) : null}
      </div>
    </div>
  );
}
