import type { SavedCourierPosition } from '@/modules/couriers/types/courier-location.types';
import type { StaffCourierLocationEvent } from '../types/realtime.types';

export function toStaffCourierLocation(saved: SavedCourierPosition): StaffCourierLocationEvent {
  return {
    courierId: saved.courierProfileId,
    lat: saved.latitude,
    lng: saved.longitude,
    at: saved.updatedAt,
  };
}
