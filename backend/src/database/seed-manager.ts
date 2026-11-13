import { ROLE } from '@/common/enums/role.enum';
import type { Database } from './database.module';
import { MANAGER_FIRST_NAME, MANAGER_LAST_NAME } from './seed.constants';
import { seedStaff } from './seed-staff';

export async function seedManager(db: Database, email: string, password: string): Promise<void> {
  await seedStaff(db, {
    role: ROLE.MANAGER,
    label: 'Manager',
    firstName: MANAGER_FIRST_NAME,
    lastName: MANAGER_LAST_NAME,
    email,
    password,
  });
}
