import type { SEARCH_STATUS } from './constants/search';
import type { AddressSuggestion } from './schemas';

export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS];

export type SuggestionsState = {
  status: SearchStatus;
  suggestions: AddressSuggestion[];
  // The reason of a failed search, ready to be shown to the user.
  message: string | null;
};
