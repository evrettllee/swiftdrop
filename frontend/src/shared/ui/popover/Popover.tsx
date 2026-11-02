import { type ReactNode, type Ref, useEffect, useId, useRef } from 'react';
import { joinClassNames } from '@/shared/lib/class-names';
import { useEscapeKey } from '@/shared/lib/dom';
import { POPOVER_ALIGN, type PopoverAlign } from './popover-align';

const ALIGN_CLASSES: Record<PopoverAlign, string> = {
  start: 'start-0',
  end: 'end-0',
};

const POINTER_DOWN = 'pointerdown';

export type PopoverTriggerProps = {
  ref: Ref<HTMLButtonElement>;
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-haspopup': 'dialog';
  onClick: () => void;
};

type PopoverProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  label: string;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  align?: PopoverAlign;
  panelClassName?: string;
  children: ReactNode;
};

export function Popover({
  isOpen,
  onOpenChange,
  label,
  trigger,
  align = POPOVER_ALIGN.START,
  panelClassName = '',
  children,
}: PopoverProps) {
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => {
    onOpenChange(false);
    triggerRef.current?.focus();
  }, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    panelRef.current?.focus();

    function handlePointerDown(event: PointerEvent): void {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
        onOpenChange(false);
      }
    }

    document.addEventListener(POINTER_DOWN, handlePointerDown);

    return () => document.removeEventListener(POINTER_DOWN, handlePointerDown);
  }, [isOpen, onOpenChange]);

  return (
    <div ref={wrapperRef} className="relative">
      {trigger({
        ref: triggerRef,
        'aria-expanded': isOpen,
        'aria-controls': panelId,
        'aria-haspopup': 'dialog',
        onClick: () => onOpenChange(!isOpen),
      })}
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label={label}
        tabIndex={-1}
        hidden={!isOpen}
        className={joinClassNames(
          'absolute top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-surface text-fg shadow-lg outline-none dark:border-border-elevated',
          ALIGN_CLASSES[align],
          panelClassName,
        )}
      >
        {isOpen ? children : null}
      </div>
    </div>
  );
}
