// Whether the courier is on the line or carries an order, as the top bar of the phone shows it.
// The connection itself is reported by the alert of the work page, not here.
export const COURIER_STATUS = {
  ON_ORDER: 'onOrder',
  ON_LINE: 'onLine',
  OFF_LINE: 'offLine',
} as const;

type CourierStatus = (typeof COURIER_STATUS)[keyof typeof COURIER_STATUS];

type CourierStatusMeta = {
  label: string;
  // Full class names, so that Tailwind finds them.
  dotClass: string;
};

export const COURIER_STATUS_META: Record<CourierStatus, CourierStatusMeta> = {
  [COURIER_STATUS.ON_ORDER]: { label: 'На заказе', dotClass: 'bg-status-active' },
  [COURIER_STATUS.ON_LINE]: { label: 'На линии', dotClass: 'bg-success' },
  [COURIER_STATUS.OFF_LINE]: { label: 'Не на линии', dotClass: 'bg-status-new' },
};

// An order comes first: while the courier carries it, the line does not matter.
export function getCourierStatus(isAvailable: boolean, hasActiveOrder: boolean): CourierStatus {
  if (hasActiveOrder) {
    return COURIER_STATUS.ON_ORDER;
  }

  return isAvailable ? COURIER_STATUS.ON_LINE : COURIER_STATUS.OFF_LINE;
}
