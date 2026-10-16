import {
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  CornersInIcon,
  CornersOutIcon,
  GpsFixIcon,
  type Icon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import type { Map as LeafletMap } from 'leaflet';
import type { RefObject } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import { MAP_TEXTS } from './map';

const BUTTON_CLASS = `flex size-11 items-center justify-center rounded-md border border-border bg-surface text-fg shadow-sm hover:bg-selected active:bg-border ${COLOR_TRANSITION_CLASS}`;

type MapControlsProps = {
  map: LeafletMap | null;
  // The expand button, for the maps that can take the whole screen.
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandButtonRef?: RefObject<HTMLButtonElement | null>;
  // A map that does not move in the page, or is too low for the whole column, shows the zoom
  // buttons only when it is expanded or in the full screen.
  zoomOnlyWhenExpanded?: boolean;
  // A map that is too low for the whole column on a phone only (below the lg breakpoint, where its
  // height changes) hides the zoom buttons there, unless it is in the full screen.
  zoomOnlyOnDesktop?: boolean;
  // The button that brings the map back to the courier, for the map of their position.
  onLocate?: () => void;
  // The button of the full screen of the browser (Fullscreen API).
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

// One look of the controls for every map: a column of 44px buttons in the top-right corner, away
// from the attribution in the bottom-left one. From the top: the zoom, «Ко мне», the size.
export function MapControls({
  map,
  isExpanded = false,
  onToggleExpand,
  expandButtonRef,
  zoomOnlyWhenExpanded = false,
  zoomOnlyOnDesktop = false,
  onLocate,
  isFullscreen = false,
  onToggleFullscreen,
}: MapControlsProps) {
  const zoomOptions = { animate: !usePrefersReducedMotion() };
  const showsZoom = isExpanded || isFullscreen || !zoomOnlyWhenExpanded;
  const zoomClassName = zoomOnlyOnDesktop && !isFullscreen ? 'max-lg:hidden' : '';

  return (
    <div className="absolute end-3 top-3 flex flex-col gap-2">
      {showsZoom ? (
        <>
          <MapButton
            label={MAP_TEXTS.ZOOM_IN}
            Icon={PlusIcon}
            onClick={() => map?.zoomIn(undefined, zoomOptions)}
            className={zoomClassName}
          />
          <MapButton
            label={MAP_TEXTS.ZOOM_OUT}
            Icon={MinusIcon}
            onClick={() => map?.zoomOut(undefined, zoomOptions)}
            className={zoomClassName}
          />
        </>
      ) : null}
      {onLocate === undefined ? null : (
        <MapButton label={MAP_TEXTS.LOCATE} Icon={GpsFixIcon} onClick={onLocate} />
      )}
      {onToggleFullscreen === undefined ? null : (
        <MapButton
          label={isFullscreen ? MAP_TEXTS.EXIT_FULLSCREEN : MAP_TEXTS.FULLSCREEN}
          Icon={isFullscreen ? CornersInIcon : CornersOutIcon}
          isPressed={isFullscreen}
          onClick={onToggleFullscreen}
        />
      )}
      {onToggleExpand === undefined ? null : (
        <MapButton
          buttonRef={expandButtonRef}
          label={isExpanded ? MAP_TEXTS.COLLAPSE : MAP_TEXTS.EXPAND}
          Icon={isExpanded ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon}
          isPressed={isExpanded}
          onClick={onToggleExpand}
        />
      )}
    </div>
  );
}

type MapButtonProps = {
  // Both the name for a screen reader and the tooltip.
  label: string;
  Icon: Icon;
  onClick: () => void;
  // A toggle button: pressed while its mode is on.
  isPressed?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  className?: string;
};

function MapButton({ label, Icon, onClick, isPressed, buttonRef, className = '' }: MapButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isPressed}
      onClick={onClick}
      className={`${BUTTON_CLASS} ${className}`}
    >
      <Icon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </button>
  );
}
