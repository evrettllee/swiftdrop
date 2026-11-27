import { execFileSync } from 'node:child_process';
import { STAND } from './stand';

const BACKEND_DIR = '../backend';
const SEED_TIMEOUT_MS = 120_000;

const SEED_ADMIN_SCRIPT = `
require('./test/support/e2e-stand-env');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./src/database/schema');
const { DB_CASING } = require('./src/database/database.constants');
const { seedAdmin } = require('./src/database/seed-steps');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema, casing: DB_CASING });
  try {
    await seedAdmin(db, process.env.STAND_ADMIN_EMAIL, process.env.STAND_ADMIN_PASSWORD);
  } finally {
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

export function seedStandAdmin(): void {
  execFileSync(
    'node',
    [
      '-r',
      'tsconfig-paths/register',
      '-r',
      'ts-node/register/transpile-only',
      '-e',
      SEED_ADMIN_SCRIPT,
    ],
    {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        STAND_ADMIN_EMAIL: STAND.ADMIN_EMAIL,
        STAND_ADMIN_PASSWORD: STAND.ADMIN_PASSWORD,
      },
      stdio: 'inherit',
      timeout: SEED_TIMEOUT_MS,
    },
  );
}
