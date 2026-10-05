import type { z } from 'zod';
import type { addressSuggestionSchema } from './schemas';

export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;
