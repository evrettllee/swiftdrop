import {
  circle,
  Circle,
  type Map as LeafletMap,
  type PathOptions,
  polygon,
  Polygon,
} from 'leaflet';
import type {} from '@geoman-io/leaflet-geoman-free';
import type { LatLngLike } from '@/entities/zone';
import { DRAW_CLASS, type DrawTool, GEOMAN_SHAPE, SNAP_DISTANCE_PX } from '../config/draw';
import { type DrawShape, SHAPE_KIND } from '../lib/draw-shape';

export type ShapeLayer = Polygon | Circle;

type EditOptions = NonNullable<Parameters<ShapeLayer['pm']['enable']>[0]>;

type VertexUndo = { _removeLastVertex?: () => void };

function plainPoint({ lat, lng }: LatLngLike): LatLngLike {
  return { lat, lng };
}

export function asShapeLayer(value: unknown): ShapeLayer | null {
  return value instanceof Polygon || value instanceof Circle ? value : null;
}

export function shapeOf(layer: ShapeLayer): DrawShape {
  if (layer instanceof Circle) {
    return {
      kind: SHAPE_KIND.CIRCLE,
      center: plainPoint(layer.getLatLng()),
      radiusM: layer.getRadius(),
    };
  }

  const rings = layer.getLatLngs();
  const outer = Array.isArray(rings[0]) ? rings[0] : rings;

  return {
    kind: SHAPE_KIND.RING,
    points: outer.flat(2).map((point) => plainPoint(point)),
  };
}

export function layerOf(shape: DrawShape): ShapeLayer {
  return shape.kind === SHAPE_KIND.CIRCLE
    ? circle(shape.center, { radius: shape.radiusM, className: DRAW_CLASS.SHAPE })
    : polygon(shape.points, { className: DRAW_CLASS.SHAPE });
}

export function snapOptions(isSnapping: boolean) {
  return { snappable: isSnapping, snapDistance: SNAP_DISTANCE_PX, allowSelfIntersection: false };
}

export function applyDrawStyles(map: LeafletMap, isSnapping: boolean): void {
  map.pm.setGlobalOptions({
    ...snapOptions(isSnapping),
    templineStyle: { className: DRAW_CLASS.TEMP_LINE },
    hintlineStyle: { className: DRAW_CLASS.HINT_LINE },
  });
}

export function startDrawing(map: LeafletMap, tool: DrawTool, isSnapping: boolean): void {
  map.pm.enableDraw(GEOMAN_SHAPE[tool], {
    ...snapOptions(isSnapping),
    tooltips: false,
    continueDrawing: false,
    pathOptions: { className: DRAW_CLASS.SHAPE },
    templineStyle: { className: DRAW_CLASS.TEMP_LINE },
    hintlineStyle: { className: DRAW_CLASS.HINT_LINE },
  });
}

export function removeLastVertex(map: LeafletMap, tool: DrawTool): void {
  const draw: unknown = map.pm.Draw[GEOMAN_SHAPE[tool]];
  const undo = (draw as VertexUndo | undefined)?._removeLastVertex;

  if (typeof undo === 'function') {
    undo.call(draw);
  }
}

export function enableEditing(layer: ShapeLayer, isSnapping: boolean): void {
  const options: EditOptions & { hintlineStyle: PathOptions } = {
    ...snapOptions(isSnapping),
    draggable: false,
    hintlineStyle: { className: DRAW_CLASS.HINT_LINE },
  };
  layer.pm.enable(options);
}
