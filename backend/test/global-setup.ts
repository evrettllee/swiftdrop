import { loadTestEnv } from '@test/support/env';
import { prepareTestDatabase } from '@test/support/database';

export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  await prepareTestDatabase();
}
