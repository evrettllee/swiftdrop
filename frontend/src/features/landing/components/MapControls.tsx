import {
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import type { Map as LeafletMap } from 'leaflet';
import type { RefObject } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants';
import { MAP_TEXTS } from '../constants';
import { usePrefersReducedMotion } from '../lib/useExpandedMap';

const BUTTON_CLASS =
  'flex size-11 items-center justify-center text-fg transition-colors duration-150 hover:bg-selected active:bg-border motion-reduce:transition-none';

type MapControlsProps = {
  map: LeafletMap | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandButtonRef: RefObject<HTMLButtonElement | null>;
};

// Zoom in, zoom out and expand, drawn over the map in the style of the design system.
export function MapControls({
  map,
  isExpanded,
  onToggleExpand,
  expandButtonRef,
}: MapControlsProps) {
  const ExpandIcon = isExpanded ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon;
  const zoomOptions = { animate: !usePrefersReducedMotion() };

  return (
    <div className="absolute end-4 top-4 flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-md">
      <button
        type="button"
        aria-label={MAP_TEXTS.ZOOM_IN}
        onClick={() => map?.zoomIn(undefined, zoomOptions)}
        className={`${BUTTON_CLASS} border-b border-border`}
      >
        <PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={MAP_TEXTS.ZOOM_OUT}
        onClick={() => map?.zoomOut(undefined, zoomOptions)}
        className={`${BUTTON_CLASS} border-b border-border`}
      >
        <MinusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
      </button>
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
    </div>
  );
}
