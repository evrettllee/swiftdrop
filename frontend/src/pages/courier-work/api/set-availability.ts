import { COURIERS_API_PATHS, type CourierMe, courierMeSchema, http } from '@/shared/api';

// Goes on or off the line; the backend answers with the whole profile.
export async function setAvailability(isAvailable: boolean): Promise<CourierMe> {
  return courierMeSchema.parse(await http.put(COURIERS_API_PATHS.AVAILABILITY, { isAvailable }));
}
