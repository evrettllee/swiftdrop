import type { z } from 'zod';
import type { SEARCH_STATUS } from './constants';
import type { addressSuggestionSchema } from './schemas';

export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;
export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS];

export type SuggestionsState = {
  status: SearchStatus;
  suggestions: AddressSuggestion[];
  // The reason of a failed search, ready to be shown to the user.
  message: string | null;
};
