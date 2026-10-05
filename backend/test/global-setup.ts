import { loadTestEnv } from './support/env';
import { prepareTestDatabase } from './support/database';

export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  await prepareTestDatabase();
}
