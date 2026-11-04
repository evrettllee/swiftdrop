import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { DrawShape } from '../lib/draw-shape';
import type { DrawController } from '../model/draw-controller';

type DrawBinderProps = { controller: DrawController; initial: DrawShape | null };

export function DrawBinder({ controller, initial }: DrawBinderProps) {
  const map = useMap();
  const initialRef = useRef(initial);

  useEffect(() => controller.attach(map, initialRef.current), [map, controller]);

  return null;
}
