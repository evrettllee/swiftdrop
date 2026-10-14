import { z } from 'zod';
import { ASSIGNMENT_VALIDATION_MESSAGES, OFFER_ID_MAX } from '../constants/assignment.constants';

const error = ASSIGNMENT_VALIDATION_MESSAGES.OFFER_ID_INVALID;

// Route params arrive as strings, so the id is coerced.
export const offerIdParamSchema = z.object({
  offerId: z.coerce
    .number({ error })
    .int({ error })
    .positive({ error })
    .max(OFFER_ID_MAX, { error }),
});

export type OfferIdParamDto = z.infer<typeof offerIdParamSchema>;
