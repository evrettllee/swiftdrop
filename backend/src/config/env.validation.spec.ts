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

const MAIL_CONFIG: Record<string, unknown> = {
  [ENV_KEYS.MAIL_HOST]: 'smtp.example.com',
  [ENV_KEYS.MAIL_PORT]: '465',
  [ENV_KEYS.MAIL_SECURE]: 'true',
  [ENV_KEYS.MAIL_USER]: 'user',
  [ENV_KEYS.MAIL_PASSWORD]: 'password',
  [ENV_KEYS.MAIL_FROM]: 'SwiftDrop <no-reply@example.com>',
};

const MAIL_KEYS = [
  ENV_KEYS.MAIL_HOST,
  ENV_KEYS.MAIL_PORT,
  ENV_KEYS.MAIL_SECURE,
  ENV_KEYS.MAIL_USER,
  ENV_KEYS.MAIL_PASSWORD,
  ENV_KEYS.MAIL_FROM,
];

function without(config: Record<string, unknown>, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(config).filter(([name]) => name !== key));
}

describe('validateEnv', () => {
  it.each(NODE_ENV_VALUES)('should accept NODE_ENV=%s', (nodeEnv) => {
    expect(() =>
      validateEnv({ ...VALID_CONFIG, ...MAIL_CONFIG, [ENV_KEYS.NODE_ENV]: nodeEnv }),
    ).not.toThrow();
  });

  it.each(MAIL_KEYS)('should refuse to start in production when %s is missing', (key) => {
    const config = { ...VALID_CONFIG, ...MAIL_CONFIG, [ENV_KEYS.NODE_ENV]: 'production' };

    expect(() => validateEnv(without(config, key))).toThrow(key);
  });

  it.each(['development', 'test'])(
    'should start without mail settings when NODE_ENV is %s',
    (nodeEnv) => {
      expect(() => validateEnv({ ...VALID_CONFIG, [ENV_KEYS.NODE_ENV]: nodeEnv })).not.toThrow();
    },
  );

  it.each(MAIL_KEYS)(
    'should start outside production when only %s is missing from the mail settings',
    (key) => {
      expect(() => validateEnv(without({ ...VALID_CONFIG, ...MAIL_CONFIG }, key))).not.toThrow();
    },
  );

  it('should turn the mail port into a number and secure into a boolean when mail is set', () => {
    const result = validateEnv({ ...VALID_CONFIG, ...MAIL_CONFIG });

    expect(result).toMatchObject({ [ENV_KEYS.MAIL_PORT]: 465, [ENV_KEYS.MAIL_SECURE]: true });
  });

  it('should refuse a mail secure flag that is not true or false', () => {
    expect(() =>
      validateEnv({ ...VALID_CONFIG, ...MAIL_CONFIG, [ENV_KEYS.MAIL_SECURE]: 'yes' }),
    ).toThrow(ENV_KEYS.MAIL_SECURE);
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
