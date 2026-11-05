import { type CSSProperties, type RefObject, useLayoutEffect, useState } from 'react';
import { POPOVER_ALIGN, type PopoverAlign } from './popover-align';

const PANEL_GAP_PX = 4;
const RESIZE_EVENT = 'resize';
const SCROLL_EVENT = 'scroll';

export function popoverPlacement(
  trigger: Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>,
  panelHeight: number,
  viewport: { width: number; height: number },
  align: PopoverAlign,
): CSSProperties {
  const below = trigger.bottom + PANEL_GAP_PX;
  const above = trigger.top - PANEL_GAP_PX - panelHeight;
  const top = below + panelHeight > viewport.height && above >= 0 ? above : below;

  return align === POPOVER_ALIGN.END
    ? { top, right: viewport.width - trigger.right }
    : { top, left: trigger.left };
}

export function usePopoverPosition(
  isOpen: boolean,
  align: PopoverAlign,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
): CSSProperties | null {
  const [position, setPosition] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function place(): void {
      const trigger = triggerRef.current;
      const panel = panelRef.current;

      if (trigger !== null && panel !== null) {
        const viewport = {
          width: document.documentElement.clientWidth,
          height: window.innerHeight,
        };
        setPosition(
          popoverPlacement(trigger.getBoundingClientRect(), panel.offsetHeight, viewport, align),
        );
      }
    }

    place();
    window.addEventListener(RESIZE_EVENT, place);
    window.addEventListener(SCROLL_EVENT, place, true);

    return () => {
      window.removeEventListener(RESIZE_EVENT, place);
      window.removeEventListener(SCROLL_EVENT, place, true);
    };
  }, [isOpen, align, triggerRef, panelRef]);

  return isOpen ? position : null;
}
