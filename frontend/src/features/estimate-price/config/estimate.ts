// API
export const PRICING_API_PATHS = {
  ESTIMATES: '/pricing/estimates',
} as const;

// The request goes out when the form has not changed for this long: the backend allows
// only 30 estimates per minute from one address.
export const ESTIMATE_DEBOUNCE_MS = 500;

export const ESTIMATE_STATUS = {
  NEEDS_ADDRESSES: 'needs-addresses',
  NEEDS_PACKAGE: 'needs-package',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;
