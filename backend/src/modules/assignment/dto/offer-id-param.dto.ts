import { z } from 'zod';
import { DB_INTEGER_MAX } from '../../../common/constants/database.constants';
import { ASSIGNMENT_VALIDATION_MESSAGES } from '../constants/assignment.constants';

const error = ASSIGNMENT_VALIDATION_MESSAGES.OFFER_ID_INVALID;

// Route params arrive as strings, so the id is coerced.
export const offerIdParamSchema = z.object({
  offerId: z.coerce
    .number({ error })
    .int({ error })
    .positive({ error })
    .max(DB_INTEGER_MAX, { error }),
});

export type OfferIdParamDto = z.infer<typeof offerIdParamSchema>;
