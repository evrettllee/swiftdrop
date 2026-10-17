export const HISTORY_FIRST_PAGE = 1;
// The same size as the page of "My orders" of the client (ORDERS_PAGE_SIZE in pages/orders), so
// the desktop shows "1–5 из 23" as the mockup does.
export const HISTORY_PAGE_SIZE = 5;
// The biggest `limit` the backend takes (HISTORY_PAGE_SIZE_MAX of the deliveries module).
export const HISTORY_PAGE_SIZE_MAX = 50;

// The desktop of the layout: the width where Tailwind's `lg` starts.
export const HISTORY_DESKTOP_QUERY = '(min-width: 64rem)';

// How a loaded page joins the list: the pagination of the desktop replaces the page, the button
// "show more" of a phone adds it to the end, and a phone that opens a page from the address asks
// for all the pages up to it at once.
export const LOAD_MODE = {
  REPLACE: 'replace',
  APPEND: 'append',
  RESTORE: 'restore',
} as const;
