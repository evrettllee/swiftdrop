import type { LeafletEvent, Map as LeafletMap } from 'leaflet';
import type { DrawTool } from '../config/draw';
import { type DrawShape, SHAPE_KIND } from '../lib/draw-shape';
import {
  applyDrawStyles,
  asShapeLayer,
  removeLastVertex,
  shapeOf,
  startDrawing,
} from './draw-layers';
import { ShapeHolder } from './shape-holder';

export type DrawState = {
  tool: DrawTool | null;
  isDrawing: boolean;
  vertexCount: number;
  shape: DrawShape | null;
  isSnapping: boolean;
  canUndo: boolean;
};

type CreateEvent = LeafletEvent & { layer: unknown };
type DrawStartEvent = LeafletEvent & {
  workingLayer: { on: (type: string, fn: () => void) => void };
};

const IDLE = { isDrawing: false, vertexCount: 0, tool: null } as const;

export class DrawController {
  private readonly holder = new ShapeHolder((shape) => this.update({ shape }));
  private state: DrawState = { ...IDLE, shape: null, isSnapping: true, canUndo: false };
  private readonly listeners = new Set<() => void>();

  getState = (): DrawState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };

  attach(map: LeafletMap, initial: DrawShape | null): () => void {
    this.holder.map = map;
    applyDrawStyles(map, this.state.isSnapping);
    map.on('pm:create', this.handleCreate);
    map.on('pm:drawstart', this.handleDrawStart);
    this.reset(initial);

    return () => {
      map.off('pm:create', this.handleCreate);
      map.off('pm:drawstart', this.handleDrawStart);
      map.pm.disableDraw();
      this.holder.place(null);
      this.holder.map = null;
    };
  }

  selectTool(tool: DrawTool): void {
    const { map } = this.holder;

    if (map === null) {
      return;
    }

    if (this.state.isDrawing) {
      map.pm.disableDraw();

      if (this.state.tool === tool) {
        this.update({ ...IDLE, shape: this.holder.shape });

        return;
      }
    }

    if (this.holder.shape !== null) {
      this.holder.remember();
      this.holder.place(null);
    }

    startDrawing(map, tool, this.state.isSnapping);
    this.update({ tool, isDrawing: true, vertexCount: 0, shape: null });
  }

  undo(): void {
    const { state } = this;
    const { map } = this.holder;

    if (map !== null && state.isDrawing && state.tool !== null && state.vertexCount > 0) {
      removeLastVertex(map, state.tool);
      this.update({ vertexCount: state.vertexCount - 1 });

      return;
    }

    const previous = this.holder.takeBack();

    if (previous !== undefined) {
      map?.pm.disableDraw();
      this.holder.place(previous);
      this.update({ ...IDLE, shape: previous });
    }
  }

  clear(): void {
    this.holder.map?.pm.disableDraw();

    if (this.holder.shape !== null) {
      this.holder.remember();
    }

    this.holder.place(null);
    this.update({ ...IDLE, shape: null });
  }

  reset(shape: DrawShape | null): void {
    this.holder.map?.pm.disableDraw();
    this.holder.forget();
    this.holder.place(shape);
    this.update({ ...IDLE, shape });
  }

  setSnapping(isSnapping: boolean): void {
    if (this.holder.map !== null) {
      applyDrawStyles(this.holder.map, isSnapping);
    }

    this.holder.setSnapping(isSnapping);
    this.update({ isSnapping });
  }

  replace(shape: DrawShape): void {
    this.holder.remember();
    this.holder.place(shape);
    this.update({ shape, tool: shape.kind === SHAPE_KIND.CIRCLE ? this.state.tool : null });
  }

  private readonly handleDrawStart = (event: LeafletEvent): void => {
    (event as DrawStartEvent).workingLayer.on('pm:vertexadded', () =>
      this.update({ vertexCount: this.state.vertexCount + 1 }),
    );
  };

  private readonly handleCreate = (event: LeafletEvent): void => {
    const layer = asShapeLayer((event as CreateEvent).layer);

    if (layer !== null) {
      layer.remove();
      const shape = shapeOf(layer);
      this.holder.place(shape);
      this.update({ shape, isDrawing: false, vertexCount: 0 });
    }
  };

  private update(patch: Partial<DrawState>): void {
    const next = { ...this.state, ...patch };
    this.state = {
      ...next,
      canUndo: this.holder.hasHistory || (next.isDrawing && next.vertexCount > 0),
    };
    this.listeners.forEach((listener) => listener());
  }
}
