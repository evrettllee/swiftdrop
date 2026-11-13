import {
  DEFAULT_PORT,
  ENV_KEYS,
  JWT_SECRET_MIN_LENGTH,
  MAIL_SECURE_TRUE,
  MAIL_SECURE_VALUES,
  MIN_REQUIRED_LENGTH,
  NODE_ENV_PRODUCTION,
  NODE_ENV_VALUES,
  PORT_MAX,
  PORT_MIN,
  STRIPE_SECRET_KEY_PREFIX,
  STRIPE_WEBHOOK_SECRET_PREFIX,
} from './env.constants';

function requireString(
  config: Record<string, unknown>,
  name: string,
  minLength = MIN_REQUIRED_LENGTH,
): string {
  const value = config[name];

  if (typeof value !== 'string' || value.length < minLength) {
    throw new Error(`${name} is required and must be at least ${minLength} characters`);
  }

  return value;
}

function requireWithPrefix(config: Record<string, unknown>, name: string, prefix: string): string {
  const value = requireString(config, name);

  if (!value.startsWith(prefix)) {
    throw new Error(`${name} must start with "${prefix}"`);
  }

  return value;
}

function requireOneOf(
  config: Record<string, unknown>,
  name: string,
  allowed: readonly string[],
): string {
  const value = config[name];

  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`${name} is required and must be one of: ${allowed.join(', ')}`);
  }

  return value;
}

function requireUrl(config: Record<string, unknown>, name: string): string {
  const value = requireString(config, name);

  if (!URL.canParse(value)) {
    throw new Error(`${name} must be a full address, for example http://localhost:5173`);
  }

  return value;
}

function requirePort(name: string, rawPort: unknown): number {
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
    throw new Error(
      `${name} must be an integer between ${PORT_MIN} and ${PORT_MAX}, got: ${JSON.stringify(rawPort)}`,
    );
  }

  return port;
}

function isFilled(config: Record<string, unknown>, name: string): boolean {
  const value = config[name];

  return typeof value === 'string' && value.length > 0;
}

function validateMail(config: Record<string, unknown>, nodeEnv: string): Record<string, unknown> {
  const required = nodeEnv === NODE_ENV_PRODUCTION;
  const mail: Record<string, unknown> = {};

  if (required) {
    requireString(config, ENV_KEYS.MAIL_HOST);
    requireString(config, ENV_KEYS.MAIL_USER);
    requireString(config, ENV_KEYS.MAIL_PASSWORD);
    requireString(config, ENV_KEYS.MAIL_FROM);
  }

  if (required || isFilled(config, ENV_KEYS.MAIL_PORT)) {
    mail[ENV_KEYS.MAIL_PORT] = requirePort(ENV_KEYS.MAIL_PORT, config[ENV_KEYS.MAIL_PORT]);
  }

  if (required || isFilled(config, ENV_KEYS.MAIL_SECURE)) {
    const secure = requireOneOf(config, ENV_KEYS.MAIL_SECURE, MAIL_SECURE_VALUES);
    mail[ENV_KEYS.MAIL_SECURE] = secure === MAIL_SECURE_TRUE;
  }

  return mail;
}

export function validateEnv(config: Record<string, unknown>) {
  const port = requirePort(ENV_KEYS.PORT, config[ENV_KEYS.PORT] ?? DEFAULT_PORT);
  const nodeEnv = requireOneOf(config, ENV_KEYS.NODE_ENV, NODE_ENV_VALUES);
  requireUrl(config, ENV_KEYS.APP_URL);
  requireString(config, ENV_KEYS.DATABASE_URL);
  requireString(config, ENV_KEYS.OSRM_URL);
  requireString(config, ENV_KEYS.JWT_ACCESS_SECRET, JWT_SECRET_MIN_LENGTH);
  requireString(config, ENV_KEYS.GOOGLE_CLIENT_ID);
  requireString(config, ENV_KEYS.GOOGLE_CLIENT_SECRET);
  requireString(config, ENV_KEYS.GOOGLE_CALLBACK_URL);
  requireString(config, ENV_KEYS.YANDEX_CLIENT_ID);
  requireString(config, ENV_KEYS.YANDEX_CLIENT_SECRET);
  requireString(config, ENV_KEYS.YANDEX_CALLBACK_URL);
  requireWithPrefix(config, ENV_KEYS.STRIPE_SECRET_KEY, STRIPE_SECRET_KEY_PREFIX);
  requireWithPrefix(config, ENV_KEYS.STRIPE_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET_PREFIX);
  const mail = validateMail(config, nodeEnv);

  return { ...config, ...mail, [ENV_KEYS.PORT]: port };
}
