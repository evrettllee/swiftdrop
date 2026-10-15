import {
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  GpsFixIcon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import type { Map as LeafletMap } from 'leaflet';
import type { RefObject } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import { MAP_TEXTS } from './map';

const BUTTON_CLASS = `flex size-11 items-center justify-center text-fg hover:bg-selected active:bg-border ${COLOR_TRANSITION_CLASS}`;

type MapControlsProps = {
  map: LeafletMap | null;
  // The expand button, for the maps that can take the whole screen.
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandButtonRef?: RefObject<HTMLButtonElement | null>;
  // A map that does not move in the page shows the zoom buttons only when it is expanded.
  zoomOnlyWhenExpanded?: boolean;
  // The button that brings the map back to the courier, for the map of their position.
  onLocate?: () => void;
};

// One look of the controls for every map: a column of 44px buttons in the top-right corner, away
// from the attribution in the bottom-left one.
export function MapControls({
  map,
  isExpanded = false,
  onToggleExpand,
  expandButtonRef,
  zoomOnlyWhenExpanded = false,
  onLocate,
}: MapControlsProps) {
  const ExpandIcon = isExpanded ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon;
  const zoomOptions = { animate: !usePrefersReducedMotion() };
  const showsZoom = isExpanded || !zoomOnlyWhenExpanded;

  return (
    <div className="absolute end-4 top-4 flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-md">
      {showsZoom ? (
        <>
          <button
            type="button"
            aria-label={MAP_TEXTS.ZOOM_IN}
            onClick={() => map?.zoomIn(undefined, zoomOptions)}
            className={`${BUTTON_CLASS} border-b border-border last:border-b-0`}
          >
            <PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={MAP_TEXTS.ZOOM_OUT}
            onClick={() => map?.zoomOut(undefined, zoomOptions)}
            className={`${BUTTON_CLASS} border-b border-border last:border-b-0`}
          >
            <MinusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </button>
        </>
      ) : null}
      {onLocate === undefined ? null : (
        <button
          type="button"
          aria-label={MAP_TEXTS.LOCATE}
          onClick={onLocate}
          className={`${BUTTON_CLASS} border-b border-border last:border-b-0`}
        >
          <GpsFixIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
      )}
      {onToggleExpand === undefined ? null : (
        <button
          ref={expandButtonRef}
          type="button"
          aria-label={isExpanded ? MAP_TEXTS.COLLAPSE : MAP_TEXTS.EXPAND}
          aria-pressed={isExpanded}
          onClick={onToggleExpand}
          className={BUTTON_CLASS}
        >
          <ExpandIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
