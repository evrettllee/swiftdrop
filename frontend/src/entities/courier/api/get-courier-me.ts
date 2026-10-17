import { COURIERS_API_PATHS, type CourierMe, courierMeSchema, http } from '@/shared/api';

export async function getCourierMe(signal?: AbortSignal): Promise<CourierMe> {
  return courierMeSchema.parse(await http.get(COURIERS_API_PATHS.ME, { signal }));
}
