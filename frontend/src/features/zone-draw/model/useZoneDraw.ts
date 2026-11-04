import { useState, useSyncExternalStore } from 'react';
import type { LatLngLike } from '@/entities/zone';
import { circleRing } from '@/entities/zone';
import { METERS_PER_KM } from '../config/draw';
import { type DrawShape, SHAPE_KIND, shapePoints } from '../lib/draw-shape';
import { DrawController } from './draw-controller';

export function useZoneDraw() {
  const [controller] = useState(() => new DrawController());
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const { shape } = state;

  function setRadiusKm(km: number): void {
    if (shape?.kind === SHAPE_KIND.CIRCLE) {
      controller.replace({ ...shape, radiusM: km * METERS_PER_KM });
    }
  }

  function toPoints(): void {
    if (shape?.kind === SHAPE_KIND.CIRCLE) {
      const center = { latitude: shape.center.lat, longitude: shape.center.lng };
      const points = circleRing(center, shape.radiusM).map(
        ({ latitude, longitude }): LatLngLike => ({ lat: latitude, lng: longitude }),
      );
      controller.replace({ kind: SHAPE_KIND.RING, points });
    }
  }

  return {
    controller,
    state,
    points: shapePoints(shape),
    radiusKm: shape?.kind === SHAPE_KIND.CIRCLE ? shape.radiusM / METERS_PER_KM : null,
    setRadiusKm,
    toPoints,
    reset: (next: DrawShape | null) => controller.reset(next),
  };
}

export type ZoneDraw = ReturnType<typeof useZoneDraw>;
