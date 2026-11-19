import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { buildMoneySchema } from '@/common/schemas/money.schema';
import {
  ADMIN_TARIFF_MESSAGES as MESSAGES,
  TARIFF_NAME_MAX_LENGTH,
  TARIFF_NAME_MIN_LENGTH,
  TARIFF_PRICE_MAX,
} from '../constants/admin-tariffs.constants';

const tariffFields = {
  name: z
    .string({ error: MESSAGES.NAME_LENGTH })
    .trim()
    .min(TARIFF_NAME_MIN_LENGTH, MESSAGES.NAME_LENGTH)
    .max(TARIFF_NAME_MAX_LENGTH, MESSAGES.NAME_LENGTH),
  pricePerKm: buildMoneySchema(TARIFF_PRICE_MAX.pricePerKm),
  pricePerKg: buildMoneySchema(TARIFF_PRICE_MAX.pricePerKg),
  minPrice: buildMoneySchema(TARIFF_PRICE_MAX.minPrice),
  fragileFee: buildMoneySchema(TARIFF_PRICE_MAX.fragileFee),
};

export const createTariffSchema = z.strictObject(tariffFields);

export type CreateTariffDto = z.infer<typeof createTariffSchema>;

export const updateTariffSchema = z
  .strictObject({
    name: tariffFields.name.optional(),
    pricePerKm: tariffFields.pricePerKm.optional(),
    pricePerKg: tariffFields.pricePerKg.optional(),
    minPrice: tariffFields.minPrice.optional(),
    fragileFee: tariffFields.fragileFee.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: MESSAGES.NOTHING_TO_UPDATE,
  });

export type UpdateTariffDto = z.infer<typeof updateTariffSchema>;

export const tariffStatusSchema = z.strictObject({
  isActive: z.boolean({ error: MESSAGES.IS_ACTIVE_INVALID }),
});

export type TariffStatusDto = z.infer<typeof tariffStatusSchema>;

export const tariffIdParamSchema = z.strictObject({
  tariffId: z.coerce
    .number({ error: MESSAGES.TARIFF_ID_INVALID })
    .int(MESSAGES.TARIFF_ID_INVALID)
    .positive(MESSAGES.TARIFF_ID_INVALID)
    .max(DB_INTEGER_MAX, MESSAGES.TARIFF_ID_INVALID),
});

export type TariffIdParamDto = z.infer<typeof tariffIdParamSchema>;
