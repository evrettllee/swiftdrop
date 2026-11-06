import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { joinClassNames } from '@/shared/lib/class-names';
import { useEscapeKey } from '@/shared/lib/dom';
import { POPOVER_KIND, type PopoverAlign, POPOVER_ALIGN, type PopoverKind } from './popover-align';
import { focusMenuItem, isMenuKey } from './popover-menu';
import { usePopoverPosition } from './usePopoverPosition';

const POINTER_DOWN = 'pointerdown';
const TAB_KEY = 'Tab';

export type PopoverTriggerProps = {
  ref: Ref<HTMLButtonElement>;
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-haspopup': PopoverKind;
  onClick: () => void;
};

type PopoverProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  label: string;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  align?: PopoverAlign;
  kind?: PopoverKind;
  panelClassName?: string;
  children: ReactNode;
};

function useOutsidePress(
  isOpen: boolean,
  parts: readonly { current: HTMLElement | null }[],
  onOutside: () => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent): void {
      const { target } = event;

      if (target instanceof Node && !parts.some((part) => part.current?.contains(target))) {
        onOutside();
      }
    }

    document.addEventListener(POINTER_DOWN, handlePointerDown);

    return () => document.removeEventListener(POINTER_DOWN, handlePointerDown);
  }, [isOpen, parts, onOutside]);
}

export function Popover({
  isOpen,
  onOpenChange,
  label,
  trigger,
  align = POPOVER_ALIGN.START,
  kind = POPOVER_KIND.DIALOG,
  panelClassName = '',
  children,
}: PopoverProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const parts = useMemo(() => [triggerRef, panelRef], []);
  const position = usePopoverPosition(isOpen, align, triggerRef, panelRef);
  const isMenu = kind === POPOVER_KIND.MENU;

  const closeToTrigger = () => {
    onOpenChange(false);
    triggerRef.current?.focus();
  };

  useEscapeKey(closeToTrigger, isOpen);
  useOutsidePress(isOpen, parts, () => onOpenChange(false));

  const isPlaced = position !== null;

  useEffect(() => {
    const panel = panelRef.current;

    if (isPlaced && panel !== null && !(isMenu && focusMenuItem(panel, 'first'))) {
      panel.focus();
    }
  }, [isPlaced, isMenu]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (isMenu && isMenuKey(event.key)) {
      event.preventDefault();
      focusMenuItem(event.currentTarget, event.key);
    } else if (isMenu && event.key === TAB_KEY) {
      onOpenChange(false);
    }
  }

  const style: CSSProperties = position ?? { visibility: 'hidden' };

  return (
    <>
      {trigger({
        ref: triggerRef,
        'aria-expanded': isOpen,
        'aria-controls': panelId,
        'aria-haspopup': kind,
        onClick: () => onOpenChange(!isOpen),
      })}
      {createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role={kind}
          aria-label={label}
          tabIndex={-1}
          hidden={!isOpen}
          style={style}
          onKeyDown={handleKeyDown}
          className={joinClassNames(
            'fixed z-30 overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border border-border-elevated bg-surface-elevated text-fg shadow-lg outline-none',
            panelClassName,
          )}
        >
          {isOpen ? children : null}
        </div>,
        document.body,
      )}
    </>
  );
}
