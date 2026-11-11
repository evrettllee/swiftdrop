import { STAFF_VEHICLE_LABELS } from '@/entities/courier';
import type { AnalyticsCourier } from '@/shared/analytics-api';
import { formatCount, pluralize } from '@/shared/lib/format';
import { COURIER_TEXTS, DELIVERY_FORMS, KPI_TEXTS, MANAGER_ANALYTICS_TEXTS } from '../config/texts';
import { formatDecimal, formatPercent } from './numbers';

export type CourierRow = {
  id: number;
  name: string;
  vehicle: string | null;
  delivered: string;
  deliveries: string;
  onTime: string;
  avgTime: string;
  declined: string;
  hours: string;
  hoursShort: string;
};

export function courierRow(courier: AnalyticsCourier): CourierRow {
  const hours = formatDecimal(courier.hoursOnline);

  return {
    id: courier.courierId,
    name: courier.name,
    vehicle: courier.vehicleType === null ? null : STAFF_VEHICLE_LABELS[courier.vehicleType],
    delivered: formatCount(courier.delivered),
    deliveries: `${formatCount(courier.delivered)} ${pluralize(courier.delivered, DELIVERY_FORMS)}`,
    onTime: formatPercent(courier.onTimePct),
    avgTime:
      courier.avgDeliveryMin === null
        ? MANAGER_ANALYTICS_TEXTS.EMPTY
        : KPI_TEXTS.minutes(formatDecimal(courier.avgDeliveryMin)),
    declined: formatCount(courier.declinedOffers),
    hours,
    hoursShort: COURIER_TEXTS.hours(hours),
  };
}
