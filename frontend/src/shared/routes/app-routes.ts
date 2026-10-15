export const APP_ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  PROFILE: '/profile',
  ADDRESSES: '/addresses',
  ORDERS: '/orders',
  ORDER_NEW: '/new-order',
  FORGOT_PASSWORD: '/forgot-password',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  COURIER_WORK: '/courier',
  COURIER_HISTORY: '/courier/history',
  COURIER_PROFILE: '/courier/profile',
  COURIER_VEHICLE: '/courier/vehicle',
} as const;

// The router pattern of the page of one order and the path to a concrete order.
export const ORDER_ID_PARAM = 'orderId';
export const ORDER_DETAILS_PATTERN = `${APP_ROUTES.ORDERS}/:${ORDER_ID_PARAM}`;

export function getOrderPath(orderId: number): string {
  return `${APP_ROUTES.ORDERS}/${orderId}`;
}

// The router pattern for every address that matches no page.
export const CATCH_ALL_ROUTE = '*';
