import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PerfSeedStep } from './perf-seed-people.sql';

const BREAKPOINT = '--> statement-breakpoint';

export function migrationBackfill(migration: string, label: string): PerfSeedStep[] {
  return readFileSync(join(__dirname, '..', '..', 'drizzle', migration), 'utf8')
    .split(BREAKPOINT)
    .map((statement) => statement.trim())
    .filter((statement) => statement.startsWith('UPDATE'))
    .map((statement, index) => [`${label} ${index + 1}`, statement] as const);
}
