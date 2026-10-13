import { eq } from 'drizzle-orm';
import type { Database } from '../../src/database/database.module';
import { userOauthAccounts, users } from '../../src/database/schema';

export function findUsers(db: Database) {
  return db.select().from(users);
}

export function findLinks(db: Database) {
  return db.select().from(userOauthAccounts);
}

export async function blockUser(db: Database, email: string): Promise<void> {
  await db.update(users).set({ isBlocked: true }).where(eq(users.email, email));
}
