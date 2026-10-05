// Mapbox Geocoding API v6: the same public token as for the map tiles.
export const GEOCODING_BASE_URL = 'https://api.mapbox.com/search/geocode/v6';

export const GEOCODING_PATHS = {
  FORWARD: '/forward',
  REVERSE: '/reverse',
} as const;

// The search is limited to Belarus, to Russian names, to addresses and streets.
export const GEOCODING_PARAMS = {
  LANGUAGE: 'ru',
  COUNTRY: 'by',
  TYPES: 'address,street',
  LIMIT: 5,
  // Results near the center of Minsk go first: longitude,latitude.
  PROXIMITY: '27.559,53.9006',
  // Suggestions come only from the area around Minsk, where the courier service works:
  // west,south,east,north. The exact check of the service zone is done by the backend.
  BBOX: '27.3,53.75,27.85,54.05',
} as const;

// Shorter queries are not sent at all: they match too many places.
export const GEOCODING_MIN_QUERY_LENGTH = 3;

// A cancelled request is not an error: the caller has already asked for something newer.
export const ABORT_ERROR_NAME = 'AbortError';

export const GEOCODING_ERROR_MESSAGES = {
  NETWORK: 'Нет соединения. Проверьте интернет и повторите попытку',
  UNAVAILABLE: 'Поиск адресов временно недоступен. Укажите точку на карте',
} as const;
