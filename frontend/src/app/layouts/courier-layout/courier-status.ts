// Whether the courier is on the line, as the top bar of the phone shows it. The connection itself
// is reported by the alert of the work page, not here.
export const COURIER_STATUS = {
  ON_LINE: 'onLine',
  OFF_LINE: 'offLine',
} as const;

export type CourierStatus = (typeof COURIER_STATUS)[keyof typeof COURIER_STATUS];

type CourierStatusMeta = {
  label: string;
  // Full class names, so that Tailwind finds them.
  dotClass: string;
};

export const COURIER_STATUS_META: Record<CourierStatus, CourierStatusMeta> = {
  [COURIER_STATUS.ON_LINE]: { label: 'На линии', dotClass: 'bg-success' },
  [COURIER_STATUS.OFF_LINE]: { label: 'Не на линии', dotClass: 'bg-status-new' },
};

export function getCourierStatus(isAvailable: boolean): CourierStatus {
  return isAvailable ? COURIER_STATUS.ON_LINE : COURIER_STATUS.OFF_LINE;
}
