import { API_BASE_PATH, AUTH_API_PATHS } from '../../../shared/constants/api';

// OAuth: a full-page navigation, not an API call, so the base path is included.
export const OAUTH_START_URLS = {
  google: `${API_BASE_PATH}${AUTH_API_PATHS.GOOGLE}`,
  yandex: `${API_BASE_PATH}${AUTH_API_PATHS.YANDEX}`,
} as const;

// Provider marks keep their brand colors: the only colors outside the design system tokens.
export const YANDEX_BRAND_COLOR = '#FC3F1D';
export const YANDEX_MARK_TEXT_COLOR = '#FFFFFF';
export const YANDEX_MARK_LETTER = 'Я';

export const GOOGLE_BRAND_COLORS = {
  BLUE: '#4285F4',
  GREEN: '#34A853',
  YELLOW: '#FBBC05',
  RED: '#EA4335',
} as const;
