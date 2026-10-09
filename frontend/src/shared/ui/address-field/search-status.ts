import type { AddressSuggestion } from '@/shared/api';

// The request goes out when the user has stopped typing for this long.
export const GEOCODING_DEBOUNCE_MS = 300;

export const SEARCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS];

export type SuggestionsState = {
  status: SearchStatus;
  suggestions: AddressSuggestion[];
  // The reason of a failed search, ready to be shown to the user.
  message: string | null;
};
