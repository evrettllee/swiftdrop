import { expect, test } from '@playwright/test';
import { POPOVER_ALIGN } from './popover-align';
import { MENU_KEY, nextMenuIndex } from './popover-menu';
import { popoverPlacement } from './usePopoverPosition';

const VIEWPORT = { width: 1440, height: 900 };
const TRIGGER = { top: 100, bottom: 144, left: 1300, right: 1344 };

test('should put the panel under the trigger, at its end edge when asked', () => {
  expect(popoverPlacement(TRIGGER, 200, VIEWPORT, POPOVER_ALIGN.END)).toEqual({
    top: 148,
    right: 96,
  });
  expect(popoverPlacement(TRIGGER, 200, VIEWPORT, POPOVER_ALIGN.START)).toEqual({
    top: 148,
    left: 1300,
  });
});

test('should put the panel above the trigger when it does not fit under it', () => {
  const low = { ...TRIGGER, top: 800, bottom: 844 };

  expect(popoverPlacement(low, 200, VIEWPORT, POPOVER_ALIGN.END)).toEqual({
    top: 596,
    right: 96,
  });
});

test('should move between the menu items in a circle', () => {
  expect(nextMenuIndex(MENU_KEY.NEXT, -1, 3)).toBe(0);
  expect(nextMenuIndex(MENU_KEY.NEXT, 2, 3)).toBe(0);
  expect(nextMenuIndex(MENU_KEY.PREVIOUS, 0, 3)).toBe(2);
  expect(nextMenuIndex(MENU_KEY.LAST, 0, 3)).toBe(2);
  expect(nextMenuIndex('first', 1, 3)).toBe(0);
});
