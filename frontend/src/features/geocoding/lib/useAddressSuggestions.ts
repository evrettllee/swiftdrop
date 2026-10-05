import { useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/http';
import { searchAddresses } from '../api';
import {
  GEOCODING_DEBOUNCE_MS,
  GEOCODING_ERROR_MESSAGES,
  GEOCODING_MIN_QUERY_LENGTH,
  SEARCH_STATUS,
} from '../constants';
import type { SuggestionsState } from '../types';

const IDLE_STATE: SuggestionsState = {
  status: SEARCH_STATUS.IDLE,
  suggestions: [],
  message: null,
};

// Suggestions for the typed text: the request goes out when the user stops typing, and a newer
// text cancels the older request. `isActive` is false while the text was not typed by the user
// (for example it was filled in from the map), then nothing is searched.
export function useAddressSuggestions(text: string, isActive: boolean): SuggestionsState {
  const [state, setState] = useState<SuggestionsState>(IDLE_STATE);

  useEffect(() => {
    const controller = new AbortController();

    async function search(): Promise<void> {
      if (text.trim().length < GEOCODING_MIN_QUERY_LENGTH) {
        setState(IDLE_STATE);
        return;
      }

      setState((current) => ({ ...current, status: SEARCH_STATUS.LOADING, message: null }));

      try {
        const suggestions = await searchAddresses(text, controller.signal);
        setState({ status: SEARCH_STATUS.READY, suggestions, message: null });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: SEARCH_STATUS.ERROR,
            suggestions: [],
            message:
              error instanceof ApiError ? error.message : GEOCODING_ERROR_MESSAGES.UNAVAILABLE,
          });
        }
      }
    }

    const timer = window.setTimeout(() => {
      if (isActive) {
        void search();
      }
    }, GEOCODING_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [text, isActive]);

  return state;
}
