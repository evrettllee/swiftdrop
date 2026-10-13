import { z } from 'zod';

// The part of the NBRB answer that is used: the rate is given for Cur_Scale units of the currency.
export const nbrbRateSchema = z.object({
  Cur_Scale: z.number().positive(),
  Cur_OfficialRate: z.number().positive(),
});
