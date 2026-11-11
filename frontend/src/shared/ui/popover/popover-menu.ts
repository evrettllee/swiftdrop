const MENU_ITEM_SELECTOR = '[role="menuitem"]';

export const MENU_KEY = {
  NEXT: 'ArrowDown',
  PREVIOUS: 'ArrowUp',
  FIRST: 'Home',
  LAST: 'End',
} as const;

type MenuKey = (typeof MENU_KEY)[keyof typeof MENU_KEY];

const MENU_KEYS: readonly string[] = Object.values(MENU_KEY);

export function isMenuKey(key: string): key is MenuKey {
  return MENU_KEYS.includes(key);
}

export function nextMenuIndex(key: MenuKey | 'first', current: number, count: number): number {
  if (key === 'first' || key === MENU_KEY.FIRST) {
    return 0;
  }

  if (key === MENU_KEY.LAST) {
    return count - 1;
  }

  const step = key === MENU_KEY.NEXT ? 1 : -1;

  return current === -1 ? (step === 1 ? 0 : count - 1) : (current + step + count) % count;
}

export function focusMenuItem(menu: HTMLElement, key: MenuKey | 'first'): boolean {
  const items = Array.from(menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));

  if (items.length === 0) {
    return false;
  }

  const current = items.findIndex((item) => item === document.activeElement);
  items[nextMenuIndex(key, current, items.length)].focus();

  return true;
}
