// The one .env of the repository lies next to the backend folder.
export const ENV_FILE_PATH = '../.env';

export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  APP_URL: 'APP_URL',
  DATABASE_URL: 'DATABASE_URL',
  OSRM_URL: 'OSRM_URL',
  JWT_ACCESS_SECRET: 'JWT_ACCESS_SECRET',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  GOOGLE_CALLBACK_URL: 'GOOGLE_CALLBACK_URL',
  YANDEX_CLIENT_ID: 'YANDEX_CLIENT_ID',
  YANDEX_CLIENT_SECRET: 'YANDEX_CLIENT_SECRET',
  YANDEX_CALLBACK_URL: 'YANDEX_CALLBACK_URL',
  STRIPE_SECRET_KEY: 'STRIPE_SECRET_KEY',
  STRIPE_WEBHOOK_SECRET: 'STRIPE_WEBHOOK_SECRET',
} as const;

export const NODE_ENV_PRODUCTION = 'production';
// Required, so production cannot start without it and lose the Secure flag of the session cookies.
export const NODE_ENV_VALUES = ['development', 'test', NODE_ENV_PRODUCTION] as const;

export const DEFAULT_PORT = '8080';
export const PORT_MIN = 1;
export const PORT_MAX = 65535;

export const MIN_REQUIRED_LENGTH = 1;
export const JWT_SECRET_MIN_LENGTH = 32;

// Secret keys of Stripe start with sk_, webhook signing secrets with whsec_.
// A publishable key (pk_) pasted by mistake is caught at startup.
export const STRIPE_SECRET_KEY_PREFIX = 'sk_';
export const STRIPE_WEBHOOK_SECRET_PREFIX = 'whsec_';
