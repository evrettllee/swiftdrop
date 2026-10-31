import { z } from 'zod';
import { unknownParameterError } from '@/common/schemas/list-query.schema';
import { reasonSchema } from './manager-assignment.dto';

export const cancelOrderSchema = z.preprocess(
  (body) => body ?? {},
  z.strictObject({ reason: reasonSchema }, { error: unknownParameterError }),
);

export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
