import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PerfSeedStep } from './perf-seed-people.sql';

const MIGRATION = join(__dirname, '..', '..', 'drizzle', '0030_orders_analytics_facts.sql');
const BREAKPOINT = '--> statement-breakpoint';

export function orderFactsBackfill(): PerfSeedStep[] {
  return readFileSync(MIGRATION, 'utf8')
    .split(BREAKPOINT)
    .map((statement) => statement.trim())
    .filter((statement) => statement.startsWith('UPDATE'))
    .map((statement, index) => [`order facts ${index + 1}`, statement] as const);
}
