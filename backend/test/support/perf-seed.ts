import { Pool } from 'pg';
import { TEST_DB_NAME_SUFFIX } from './constants';
import { prepareTestDatabase } from './database';
import { loadTestEnv } from './env';
import { PERF_SEED_ORDERS } from './perf-seed-orders.sql';
import { PERF_SEED_PEOPLE } from './perf-seed-people.sql';
import { PERF_SEED_TALK } from './perf-seed-talk.sql';

const STEPS = [...PERF_SEED_PEOPLE, ...PERF_SEED_ORDERS, ...PERF_SEED_TALK];

async function timed(label: string, work: () => Promise<unknown>): Promise<void> {
  const startedAt = performance.now();

  await work();
  console.log(`${label}: ${Math.round(performance.now() - startedAt)} ms`);
}

async function seed(): Promise<void> {
  loadTestEnv();
  await prepareTestDatabase();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows } = await client.query<{ name: string }>('SELECT current_database() AS name');
    const name = rows[0]?.name ?? '';

    if (!name.endsWith(TEST_DB_NAME_SUFFIX)) {
      throw new Error(
        `Refusing to fill database "${name}": only a *${TEST_DB_NAME_SUFFIX} database`,
      );
    }

    await client.query('BEGIN');

    for (const [label, statement] of STEPS) {
      await timed(label, () => client.query(statement));
    }

    await client.query('COMMIT');
    await timed('analyze', () => client.query('ANALYZE'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
