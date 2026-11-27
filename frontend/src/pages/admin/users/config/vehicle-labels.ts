import { NO_VEHICLE_LABEL } from '@/entities/admin-user';
import { STAFF_VEHICLE_LABELS } from '@/entities/courier';
import { type AdminVehicleFilter, VEHICLE_FILTER_NONE } from './admin-user';

export const VEHICLE_FILTER_LABELS: Record<AdminVehicleFilter, string> = {
  ...STAFF_VEHICLE_LABELS,
  [VEHICLE_FILTER_NONE]: NO_VEHICLE_LABEL,
};
