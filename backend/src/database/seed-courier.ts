import { ROLE } from '@/common/enums/role.enum';
import type { Database } from './database.module';
import * as schema from './schema';
import { COURIER_FIRST_NAME, COURIER_LAST_NAME } from './seed.constants';
import { seedStaff } from './seed-staff';

// A courier for trying the cabinet by hand: employees are created by the admin later.
// Safe to repeat: an existing account is left as it is.
export async function seedCourier(db: Database, email: string, password: string): Promise<void> {
  await seedStaff(
    db,
    {
      role: ROLE.COURIER,
      label: 'Courier',
      firstName: COURIER_FIRST_NAME,
      lastName: COURIER_LAST_NAME,
      email,
      password,
    },
    async (tx, userId) => {
      await tx.insert(schema.courierProfiles).values({ userId });
    },
  );
}
