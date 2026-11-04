import type { Map as LeafletMap } from 'leaflet';
import { type DrawShape, SHAPE_KIND } from '../lib/draw-shape';
import { enableEditing, layerOf, type ShapeLayer, shapeOf } from './draw-layers';

const HISTORY_LIMIT = 50;

export type ShapeListener = (shape: DrawShape | null) => void;

export class ShapeHolder {
  map: LeafletMap | null = null;
  isSnapping = true;
  private layer: ShapeLayer | null = null;
  private committed: DrawShape | null = null;
  private history: (DrawShape | null)[] = [];
  private readonly onChange: ShapeListener;

  constructor(onChange: ShapeListener) {
    this.onChange = onChange;
  }

  get shape(): DrawShape | null {
    return this.committed;
  }

  get hasHistory(): boolean {
    return this.history.length > 0;
  }

  forget(): void {
    this.history = [];
  }

  remember(): void {
    this.history = [...this.history, this.committed].slice(-HISTORY_LIMIT);
  }

  takeBack(): DrawShape | null | undefined {
    if (this.history.length === 0) {
      return undefined;
    }

    return this.history.pop() ?? null;
  }

  place(shape: DrawShape | null): void {
    this.layer?.remove();
    this.layer = null;
    this.committed = shape;

    if (shape === null || this.map === null) {
      return;
    }

    const layer = layerOf(shape);
    layer.addTo(this.map);
    enableEditing(layer, this.isSnapping);
    layer.on('pm:edit', this.handleEdit);
    layer.on('pm:markerdrag', this.handleDrag);
    this.layer = layer;
  }

  setSnapping(isSnapping: boolean): void {
    this.isSnapping = isSnapping;

    if (this.layer !== null) {
      this.layer.pm.disable();
      enableEditing(this.layer, isSnapping);
    }
  }

  private readonly handleEdit = (): void => {
    if (this.layer === null) {
      return;
    }

    this.remember();
    this.committed = shapeOf(this.layer);

    if (this.committed.kind === SHAPE_KIND.CIRCLE) {
      this.layer.pm.disable();
      enableEditing(this.layer, this.isSnapping);
    }

    this.onChange(this.committed);
  };

  private readonly handleDrag = (): void => {
    if (this.layer !== null) {
      this.onChange(shapeOf(this.layer));
    }
  };
}
