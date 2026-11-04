import { DRAW_TOOL } from '../config/draw';
import { HINT_TEXTS } from '../config/texts';
import type { DrawState } from '../model/draw-controller';
import { SHAPE_KIND } from './draw-shape';

export function hintText(state: DrawState, isTouch: boolean): string | null {
  if (state.isDrawing && state.tool !== null) {
    const texts = {
      [DRAW_TOOL.POLYGON]: isTouch ? HINT_TEXTS.POLYGON_TOUCH : HINT_TEXTS.POLYGON,
      [DRAW_TOOL.CIRCLE]: isTouch ? HINT_TEXTS.CIRCLE_TOUCH : HINT_TEXTS.CIRCLE,
      [DRAW_TOOL.RECTANGLE]: isTouch ? HINT_TEXTS.RECTANGLE_TOUCH : HINT_TEXTS.RECTANGLE,
    };

    return texts[state.tool];
  }

  if (state.shape === null) {
    return HINT_TEXTS.PICK;
  }

  if (state.shape.kind === SHAPE_KIND.CIRCLE) {
    return isTouch ? HINT_TEXTS.CIRCLE_TOUCH : HINT_TEXTS.CIRCLE;
  }

  return HINT_TEXTS.EDIT;
}
