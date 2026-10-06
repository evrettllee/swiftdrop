import {
  DEFAULT_PORT,
  ENV_KEYS,
  JWT_SECRET_MIN_LENGTH,
  MIN_REQUIRED_LENGTH,
  PORT_MAX,
  PORT_MIN,
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

export function validateEnv(config: Record<string, unknown>) {
  const rawPort = config[ENV_KEYS.PORT] ?? DEFAULT_PORT;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
    throw new Error(
      `${ENV_KEYS.PORT} must be an integer between ${PORT_MIN} and ${PORT_MAX}, got: ${JSON.stringify(rawPort)}`,
    );
  }

  requireString(config, ENV_KEYS.DATABASE_URL);
  requireString(config, ENV_KEYS.OSRM_URL);
  requireString(config, ENV_KEYS.JWT_ACCESS_SECRET, JWT_SECRET_MIN_LENGTH);
  requireString(config, ENV_KEYS.GOOGLE_CLIENT_ID);
  requireString(config, ENV_KEYS.GOOGLE_CLIENT_SECRET);
  requireString(config, ENV_KEYS.GOOGLE_CALLBACK_URL);
  requireString(config, ENV_KEYS.YANDEX_CLIENT_ID);
  requireString(config, ENV_KEYS.YANDEX_CLIENT_SECRET);
  requireString(config, ENV_KEYS.YANDEX_CALLBACK_URL);

  return { ...config, [ENV_KEYS.PORT]: port };
}
