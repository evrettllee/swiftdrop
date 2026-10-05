import { loadTestEnv } from './load-test-env';
import { prepareTestDatabase } from './test-database';

export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  await prepareTestDatabase();
}
