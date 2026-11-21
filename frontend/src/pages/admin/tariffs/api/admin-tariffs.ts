import { z } from 'zod';
import { dateSchema, http } from '@/shared/api';

const TARIFFS_PATH = '/admin/tariffs';

const zoneSchema = z.object({ zoneId: z.number(), name: z.string(), isActive: z.boolean() });

export type TariffZone = z.infer<typeof zoneSchema>;

export const adminTariffSchema = z.object({
  tariffId: z.number(),
  name: z.string(),
  pricePerKm: z.number(),
  pricePerKg: z.number(),
  minPrice: z.number(),
  fragileFee: z.number(),
  isActive: z.boolean(),
  zones: z.array(zoneSchema),
  updatedAt: dateSchema,
  updatedBy: z.object({ firstName: z.string(), lastName: z.string() }).nullable(),
});

export type AdminTariff = z.infer<typeof adminTariffSchema>;

export type TariffValues = {
  name: string;
  pricePerKm: number;
  pricePerKg: number;
  minPrice: number;
  fragileFee: number;
};

export async function getTariffs(signal?: AbortSignal): Promise<AdminTariff[]> {
  return z.array(adminTariffSchema).parse(await http.get(TARIFFS_PATH, { signal }));
}

export async function createTariff(values: TariffValues): Promise<AdminTariff> {
  return adminTariffSchema.parse(await http.post(TARIFFS_PATH, values));
}

export async function updateTariff(
  tariffId: number,
  changes: Partial<TariffValues>,
): Promise<AdminTariff> {
  return adminTariffSchema.parse(await http.patch(`${TARIFFS_PATH}/${tariffId}`, changes));
}

export async function setTariffActive(tariffId: number, isActive: boolean): Promise<AdminTariff> {
  return adminTariffSchema.parse(
    await http.post(`${TARIFFS_PATH}/${tariffId}/status`, { isActive }),
  );
}
