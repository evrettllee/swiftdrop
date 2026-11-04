import {
  ArrowUUpLeftIcon,
  CircleIcon,
  type Icon,
  MagnetIcon,
  PolygonIcon,
  RectangleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { DRAW_TOOL, type DrawTool } from '../config/draw';
import { DRAW_TEXTS, TOOL_LABELS } from '../config/texts';
import type { ZoneDraw } from '../model/useZoneDraw';

const TOOL_ICONS: Record<DrawTool, Icon> = {
  [DRAW_TOOL.POLYGON]: PolygonIcon,
  [DRAW_TOOL.CIRCLE]: CircleIcon,
  [DRAW_TOOL.RECTANGLE]: RectangleIcon,
};

const BUTTON_CLASS = joinClassNames(
  'grid size-11 shrink-0 place-items-center rounded-md border shadow-sm disabled:cursor-not-allowed disabled:opacity-50',
  COLOR_TRANSITION_CLASS,
);

type ToolButtonProps = {
  label: string;
  Icon: Icon;
  isPressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolButton({ label, Icon: ButtonIcon, isPressed, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isPressed}
      disabled={disabled}
      onClick={onClick}
      className={joinClassNames(
        BUTTON_CLASS,
        isPressed === true
          ? 'border-accent bg-selected text-accent'
          : 'border-border bg-surface text-fg hover:bg-selected',
      )}
    >
      <ButtonIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </button>
  );
}

type DrawToolbarProps = {
  draw: ZoneDraw;
  isColumn: boolean;
  tools?: readonly DrawTool[];
};

export function DrawToolbar({
  draw,
  isColumn,
  tools = Object.values(DRAW_TOOL),
}: DrawToolbarProps) {
  const { controller, state } = draw;
  const groupClass = isColumn ? 'flex flex-col gap-2' : 'flex gap-2';

  return (
    <div
      role="toolbar"
      aria-label={DRAW_TEXTS.TOOLBAR}
      aria-orientation={isColumn ? 'vertical' : 'horizontal'}
      className={isColumn ? 'flex flex-col gap-4' : 'flex gap-4'}
    >
      {tools.length === 0 ? null : (
        <div className={groupClass}>
          {tools.map((tool) => (
            <ToolButton
              key={tool}
              label={TOOL_LABELS[tool]}
              Icon={TOOL_ICONS[tool]}
              isPressed={state.tool === tool}
              onClick={() => controller.selectTool(tool)}
            />
          ))}
        </div>
      )}
      <div className={groupClass}>
        <ToolButton
          label={DRAW_TEXTS.SNAP}
          Icon={MagnetIcon}
          isPressed={state.isSnapping}
          onClick={() => controller.setSnapping(!state.isSnapping)}
        />
        <ToolButton
          label={DRAW_TEXTS.UNDO}
          Icon={ArrowUUpLeftIcon}
          disabled={!state.canUndo}
          onClick={() => controller.undo()}
        />
        <ToolButton
          label={DRAW_TEXTS.CLEAR}
          Icon={TrashIcon}
          disabled={state.shape === null && !state.isDrawing}
          onClick={() => controller.clear()}
        />
      </div>
    </div>
  );
}
