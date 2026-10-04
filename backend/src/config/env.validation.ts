import {
  DEFAULT_PORT,
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
  const rawPort = config.PORT ?? DEFAULT_PORT;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
    throw new Error(
      `PORT must be an integer between ${PORT_MIN} and ${PORT_MAX}, got: ${JSON.stringify(rawPort)}`,
    );
  }

  requireString(config, 'DATABASE_URL');
  requireString(config, 'JWT_ACCESS_SECRET', JWT_SECRET_MIN_LENGTH);
  requireString(config, 'GOOGLE_CLIENT_ID');
  requireString(config, 'GOOGLE_CLIENT_SECRET');
  requireString(config, 'GOOGLE_CALLBACK_URL');

  return { ...config, PORT: port };
}
