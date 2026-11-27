import { type Icon, WarningCircleIcon } from '@phosphor-icons/react';
import { STAFF_VEHICLE_LABELS, VEHICLE_TYPE_META } from '@/entities/courier/@x/admin-user';
import type { VehicleType } from '@/shared/api';
import {
  ADMIN_USER_STATUS,
  type AdminUserStatus,
  NO_VEHICLE_LABEL,
  USER_STATUS_LABELS,
} from '../config/admin-user';

export const STATUS_TONE = {
  OK: 'ok',
  ERROR: 'error',
  MUTED: 'muted',
} as const;

export type StatusTone = (typeof STATUS_TONE)[keyof typeof STATUS_TONE];

const STATUS_TONES: Record<AdminUserStatus, StatusTone> = {
  [ADMIN_USER_STATUS.ACTIVE]: STATUS_TONE.OK,
  [ADMIN_USER_STATUS.BLOCKED]: STATUS_TONE.ERROR,
  [ADMIN_USER_STATUS.INVITED]: STATUS_TONE.MUTED,
  [ADMIN_USER_STATUS.DELETED]: STATUS_TONE.MUTED,
};

export function statusView(status: AdminUserStatus): { label: string; tone: StatusTone } {
  return { label: USER_STATUS_LABELS[status], tone: STATUS_TONES[status] };
}

export type VehicleView = { label: string; icon: Icon; isMissing: boolean };

export function vehicleView(type: VehicleType | null | undefined): VehicleView {
  if (type === null || type === undefined) {
    return { label: NO_VEHICLE_LABEL, icon: WarningCircleIcon, isMissing: true };
  }

  return {
    label: STAFF_VEHICLE_LABELS[type],
    icon: VEHICLE_TYPE_META[type].icon,
    isMissing: false,
  };
}
