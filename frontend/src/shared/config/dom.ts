// The skip link of every page leads to the element with this id.
export const MAIN_CONTENT_ID = 'main';

// Parts of generated element ids (label, hint, error, tabs and panels are linked through them).
export const ID_PART = {
  HINT: 'hint',
  ERROR: 'error',
  TAB: 'tab',
  PANEL: 'panel',
  BUTTON: 'button',
} as const;

export const ESCAPE_KEY = 'Escape';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';

export const DOM_EVENT = {
  CHANGE: 'change',
  KEY_DOWN: 'keydown',
  PAGE_HIDE: 'pagehide',
  VISIBILITY_CHANGE: 'visibilitychange',
} as const;

// The `overflow` of the body while a dialog or the expanded map covers the page.
export const SCROLL_LOCK_OVERFLOW = 'hidden';
