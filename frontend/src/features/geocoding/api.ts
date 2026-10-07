import { ApiError } from '../../shared/api/http';
import { IS_MAPBOX_CONFIGURED, MAPBOX_TOKEN } from '../../shared/config';
import { NETWORK_ERROR_STATUS } from '../../shared/constants/api';
import { MAPBOX_TOKEN_PARAM } from '../../shared/constants/map';
import type { GeoPoint } from '../../shared/types';
import {
  ABORT_ERROR_NAME,
  GEOCODING_BASE_URL,
  GEOCODING_ERROR_MESSAGES,
  GEOCODING_MIN_QUERY_LENGTH,
  GEOCODING_PARAMS,
  GEOCODING_PATHS,
} from './constants/search';
import { type AddressSuggestion, geocodingResponseSchema } from './schemas';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === ABORT_ERROR_NAME;
}

async function requestSuggestions(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (!IS_MAPBOX_CONFIGURED) {
    throw new ApiError(NETWORK_ERROR_STATUS, GEOCODING_ERROR_MESSAGES.UNAVAILABLE);
  }

  const query = new URLSearchParams({ ...params, [MAPBOX_TOKEN_PARAM]: MAPBOX_TOKEN });
  let response: Response;

  try {
    response = await fetch(`${GEOCODING_BASE_URL}${path}?${query}`, { signal });
  } catch (error) {
    throw isAbortError(error)
      ? error
      : new ApiError(NETWORK_ERROR_STATUS, GEOCODING_ERROR_MESSAGES.NETWORK);
  }

  if (!response.ok) {
    throw new ApiError(response.status, GEOCODING_ERROR_MESSAGES.UNAVAILABLE);
  }

  return geocodingResponseSchema.parse(await response.json()).features;
}

export async function searchAddresses(
  text: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const query = text.trim();

  return query.length < GEOCODING_MIN_QUERY_LENGTH
    ? []
    : requestSuggestions(
        GEOCODING_PATHS.FORWARD,
        {
          q: query,
          language: GEOCODING_PARAMS.LANGUAGE,
          country: GEOCODING_PARAMS.COUNTRY,
          types: GEOCODING_PARAMS.TYPES,
          limit: String(GEOCODING_PARAMS.LIMIT),
          proximity: GEOCODING_PARAMS.PROXIMITY,
          bbox: GEOCODING_PARAMS.BBOX,
        },
        signal,
      );
}

// The address of a point chosen on the map; null when Mapbox knows no address there.
export async function findAddressByPoint(
  point: GeoPoint,
  signal?: AbortSignal,
): Promise<AddressSuggestion | null> {
  const suggestions = await requestSuggestions(
    GEOCODING_PATHS.REVERSE,
    {
      longitude: String(point.longitude),
      latitude: String(point.latitude),
      language: GEOCODING_PARAMS.LANGUAGE,
      country: GEOCODING_PARAMS.COUNTRY,
      types: GEOCODING_PARAMS.TYPES,
    },
    signal,
  );

  return suggestions[0] ?? null;
}
