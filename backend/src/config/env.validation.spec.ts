import { ENV_KEYS, NODE_ENV_VALUES } from './env.constants';
import { validateEnv } from './env.validation';

// A complete configuration with placeholder values that pass the checks.
const VALID_CONFIG: Record<string, unknown> = {
  [ENV_KEYS.NODE_ENV]: 'development',
  [ENV_KEYS.APP_URL]: 'http://localhost:5173',
  [ENV_KEYS.DATABASE_URL]: 'postgresql://user:password@localhost:5432/db',
  [ENV_KEYS.OSRM_URL]: 'http://localhost:5000',
  [ENV_KEYS.JWT_ACCESS_SECRET]: 'unit-test-secret-that-is-long-enough',
  [ENV_KEYS.GOOGLE_CLIENT_ID]: 'google-id',
  [ENV_KEYS.GOOGLE_CLIENT_SECRET]: 'google-secret',
  [ENV_KEYS.GOOGLE_CALLBACK_URL]: 'http://localhost:5173/api/auth/google/callback',
  [ENV_KEYS.YANDEX_CLIENT_ID]: 'yandex-id',
  [ENV_KEYS.YANDEX_CLIENT_SECRET]: 'yandex-secret',
  [ENV_KEYS.YANDEX_CALLBACK_URL]: 'http://localhost:5173/api/auth/yandex/callback',
  [ENV_KEYS.STRIPE_SECRET_KEY]: 'sk_test_unit',
  [ENV_KEYS.STRIPE_WEBHOOK_SECRET]: 'whsec_unit',
};

describe('validateEnv', () => {
  it.each(NODE_ENV_VALUES)('should accept NODE_ENV=%s', (nodeEnv) => {
    expect(() => validateEnv({ ...VALID_CONFIG, [ENV_KEYS.NODE_ENV]: nodeEnv })).not.toThrow();
  });

  it('should refuse to start when NODE_ENV is missing', () => {
    const config = Object.fromEntries(
      Object.entries(VALID_CONFIG).filter(([key]) => key !== ENV_KEYS.NODE_ENV),
    );

    expect(() => validateEnv(config)).toThrow(ENV_KEYS.NODE_ENV);
  });

  it('should refuse to start when NODE_ENV is not a known environment', () => {
    expect(() => validateEnv({ ...VALID_CONFIG, [ENV_KEYS.NODE_ENV]: 'staging' })).toThrow(
      ENV_KEYS.NODE_ENV,
    );
  });
});
