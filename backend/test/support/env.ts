import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { ENV_FILE_PATH, TEST_DATABASE_ENV_NAME, TEST_DB_NAME_SUFFIX } from './constants';

// Loads the root .env without overriding variables already set, then points the app at the test database.
export function loadTestEnv(): void {
  if (existsSync(ENV_FILE_PATH)) {
    const fileValues = parseEnv(readFileSync(ENV_FILE_PATH, 'utf8'));
    process.env = { ...fileValues, ...process.env };
  }

  const testDatabaseUrl = process.env[TEST_DATABASE_ENV_NAME];

  if (!testDatabaseUrl) {
    throw new Error(`${TEST_DATABASE_ENV_NAME} is required to run e2e tests`);
  }

  if (!new URL(testDatabaseUrl).pathname.endsWith(TEST_DB_NAME_SUFFIX)) {
    throw new Error(`Test database name must end with "${TEST_DB_NAME_SUFFIX}"`);
  }

  process.env.DATABASE_URL = testDatabaseUrl;
}
