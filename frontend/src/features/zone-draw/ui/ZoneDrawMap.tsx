import { useMemo } from 'react';
import type { Neighbor } from '@/entities/zone';
import { joinClassNames } from '@/shared/lib/class-names';
import type { GeoPoint } from '@/shared/lib/geo';
import { BlockLoader } from '@/shared/ui/page-loader';
import { AREAS_FIT_PADDING, MarkersMap, ZonePolygon } from '@/shared/ui/route-map';
import { DRAW_CLASS } from '../config/draw';
import { DRAW_TEXTS } from '../config/texts';
import { type DrawShape, SHAPE_KIND } from '../lib/draw-shape';
import { hintText } from '../lib/hint';
import { snappedPoints } from '../lib/snapped';
import { GEOMAN_STATUS, useGeoman } from '../model/geoman';
import type { ZoneDraw } from '../model/useZoneDraw';
import { DrawBinder } from './DrawBinder';
import { DrawHint } from './DrawHint';
import { DrawToolbar } from './DrawToolbar';
import { RadiusLabel, SnappedMarks } from './MapMarks';
import './zone-draw.css';

type ZoneDrawMapProps = {
  draw: ZoneDraw;
  initial: DrawShape | null;
  neighbors: readonly Neighbor[];
  fitPoints: readonly GeoPoint[];
  isDesktop: boolean;
  hasToolbar: boolean;
  className: string;
};

export function ZoneDrawMap({
  draw,
  initial,
  neighbors,
  fitPoints,
  isDesktop,
  hasToolbar,
  className,
}: ZoneDrawMapProps) {
  const status = useGeoman();
  const { shape } = draw.state;
  const rings = useMemo(() => neighbors.map(({ ring }) => ring), [neighbors]);
  const snapped = shape?.kind === SHAPE_KIND.RING ? snappedPoints(shape.points, rings) : [];

  if (status !== GEOMAN_STATUS.READY) {
    return (
      <div
        className={joinClassNames(
          'grid place-items-center rounded-lg border border-border bg-field',
          className,
        )}
      >
        {status === GEOMAN_STATUS.FAILED ? null : <BlockLoader text={DRAW_TEXTS.LOADING} />}
      </div>
    );
  }

  return (
    <MarkersMap
      label={DRAW_TEXTS.MAP_LABEL}
      fitPoints={fitPoints}
      fitPadding={AREAS_FIT_PADDING}
      className={joinClassNames(DRAW_CLASS.ROOT, className)}
      overlay={
        <>
          {hasToolbar && isDesktop ? (
            <div className="absolute start-3 top-3">
              <DrawToolbar draw={draw} isColumn />
            </div>
          ) : null}
          <DrawHint text={hintText(draw.state, !isDesktop)} isTouch={!isDesktop} />
        </>
      }
    >
      {neighbors.map(({ zone, ring }) => (
        <ZonePolygon
          key={zone.id}
          ring={ring}
          label={zone.name}
          isActive={zone.isActive}
          isSelected={false}
          isGhost
        />
      ))}
      <DrawBinder controller={draw.controller} initial={initial} />
      {shape?.kind === SHAPE_KIND.CIRCLE ? (
        <RadiusLabel center={shape.center} radiusM={shape.radiusM} />
      ) : null}
      <SnappedMarks points={snapped} />
    </MarkersMap>
  );
}
