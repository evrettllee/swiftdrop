import {
  CornersInIcon,
  CornersOutIcon,
  GpsFixIcon,
  type Icon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import type { Map as LeafletMap } from 'leaflet';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import { MAP_TEXTS } from './map';

const BUTTON_CLASS = `flex size-11 items-center justify-center rounded-md border border-border bg-surface text-fg shadow-sm hover:bg-selected active:bg-border ${COLOR_TRANSITION_CLASS}`;

type MapControlsProps = {
  map: LeafletMap | null;
  // The button that brings the map back to the user, for a map of their position (a courier).
  onLocate?: () => void;
  // The button of the full screen of the browser (Fullscreen API); a browser without the API
  // gets none.
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

// One look of the controls for every map: a column of 44px buttons in the top-right corner, away
// from the attribution in the bottom-left one. From the top: the zoom, «Ко мне», the full screen.
// The zoom buttons are on the desktop and in the full screen: a phone zooms by the fingers.
export function MapControls({
  map,
  onLocate,
  isFullscreen = false,
  onToggleFullscreen,
}: MapControlsProps) {
  const zoomOptions = { animate: !usePrefersReducedMotion() };
  const zoomClassName = isFullscreen ? '' : 'max-lg:hidden';

  return (
    <div className="absolute end-3 top-3 flex flex-col gap-2">
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
  className?: string;
};

function MapButton({ label, Icon, onClick, isPressed, className = '' }: MapButtonProps) {
  return (
    <button
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
