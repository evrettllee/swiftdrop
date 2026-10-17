export const HISTORY_FIRST_PAGE = 1;
// The same size as the page of "My orders" of the client (ORDERS_PAGE_SIZE in pages/orders), so
// the desktop shows "1–5 из 23" as the mockup does. The backend allows up to 50.
export const HISTORY_PAGE_SIZE = 5;

// How a loaded page joins the list: the pagination of the desktop replaces the page, the button
// "show more" of a phone adds it to the end.
export const LOAD_MODE = {
  REPLACE: 'replace',
  APPEND: 'append',
} as const;
