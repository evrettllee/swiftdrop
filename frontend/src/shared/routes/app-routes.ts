export const APP_ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  PROFILE: '/profile',
  ADDRESSES: '/addresses',
  ORDERS: '/orders',
  ORDER_NEW: '/new-order',
  SUPPORT: '/support',
  SUPPORT_TICKET: '/support/:ticketId',
  FORGOT_PASSWORD: '/forgot-password',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  COURIER_WORK: '/courier',
  COURIER_HISTORY: '/courier/history',
  // The router pattern of a finished order of the courier.
  COURIER_HISTORY_ORDER: '/courier/history/:orderId',
  COURIER_PROFILE: '/courier/profile',
  COURIER_VEHICLE: '/courier/vehicle',
  COURIER_SUPPORT: '/courier/support',
  COURIER_SUPPORT_TICKET: '/courier/support/:ticketId',
  MANAGER_ORDERS: '/manager/orders',
  MANAGER_ORDER: '/manager/orders/:orderId',
  MANAGER_MAP: '/manager/map',
  MANAGER_SUPPORT: '/manager/support',
  MANAGER_ZONES: '/manager/zones',
  MANAGER_ZONE_NEW: '/manager/zones/new',
  MANAGER_ZONE: '/manager/zones/:zoneId',
  MANAGER_ZONES_PAGE: '/manager/zones/:zoneId?',
  MANAGER_ZONE_CONTOUR: '/manager/zones/:zoneId/contour',
  MANAGER_ANALYTICS: '/manager/analytics',
  MANAGER_ANALYTICS_COURIERS: '/manager/analytics/couriers',
  MANAGER_PROFILE: '/manager/profile',
} as const;

// The router pattern of the page of one order and the path to a concrete order.
export const ORDER_ID_PARAM = 'orderId';
export const ORDER_DETAILS_PATTERN = `${APP_ROUTES.ORDERS}/:${ORDER_ID_PARAM}`;

export function getOrderPath(orderId: number): string {
  return `${APP_ROUTES.ORDERS}/${orderId}`;
}

// The page of the history of a courier in its address, so the order page can lead back to it.
export const HISTORY_PAGE_PARAM = 'page';

const HISTORY_PAGE_PATTERN = /^[1-9]\d{0,3}$/;

// The page of the history from the address; anything but a whole number from 1 is the first page.
export function parseHistoryPage(raw: string | null): number {
  return raw !== null && HISTORY_PAGE_PATTERN.test(raw) ? Number(raw) : 1;
}

// For example "/courier/history?page=2"; the first page has no parameter.
export function getCourierHistoryPath(page: number): string {
  return page > 1
    ? `${APP_ROUTES.COURIER_HISTORY}?${new URLSearchParams({ [HISTORY_PAGE_PARAM]: String(page) })}`
    : APP_ROUTES.COURIER_HISTORY;
}

// For example "/courier/history/48213?page=2": the page of the history it was opened from.
export function getCourierHistoryOrderPath(orderId: number, page: number): string {
  const path = `${APP_ROUTES.COURIER_HISTORY}/${orderId}`;

  return page > 1 ? `${path}?${new URLSearchParams({ [HISTORY_PAGE_PARAM]: String(page) })}` : path;
}

export function getManagerOrderPath(orderId: number): string {
  return `${APP_ROUTES.MANAGER_ORDERS}/${orderId}`;
}

export const ZONE_ID_PARAM = 'zoneId';

export function getManagerZonePath(zoneId: number): string {
  return `${APP_ROUTES.MANAGER_ZONES}/${zoneId}`;
}

export function getManagerZoneContourPath(zoneId: number): string {
  return `${getManagerZonePath(zoneId)}/contour`;
}

export const MANAGER_TICKET_PARAM = 'ticket';

export function getManagerTicketPath(ticketId: number): string {
  return `${APP_ROUTES.MANAGER_SUPPORT}?${new URLSearchParams({ [MANAGER_TICKET_PARAM]: String(ticketId) })}`;
}

export const SUPPORT_TICKET_PARAM = 'ticketId';
export const SUPPORT_NEW_PARAM = 'new';
export const SUPPORT_NEW_VALUE = '1';
export const SUPPORT_ORDER_PARAM = 'orderId';

export function getSupportTicketPath(supportPath: string, ticketId: number): string {
  return `${supportPath}/${ticketId}`;
}

export function getNewTicketPath(supportPath: string, orderId: number | null): string {
  const search = new URLSearchParams({ [SUPPORT_NEW_PARAM]: SUPPORT_NEW_VALUE });

  if (orderId !== null) {
    search.set(SUPPORT_ORDER_PARAM, String(orderId));
  }

  return `${supportPath}?${search.toString()}`;
}

// The router pattern for every address that matches no page.
export const CATCH_ALL_ROUTE = '*';
