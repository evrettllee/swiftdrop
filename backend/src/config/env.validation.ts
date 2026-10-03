export function validateEnv(config: Record<string, unknown>) {
  const rawPort = config.PORT ?? '8080';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got: ${JSON.stringify(rawPort)}`);
  }

  return { ...config, PORT: port };
}
