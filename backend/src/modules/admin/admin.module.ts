import { Module } from '@nestjs/common';
import { MailModule } from '@/integrations/mail/mail.module';
import { AssignmentModule } from '@/modules/assignment/assignment.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { CouriersModule } from '@/modules/couriers/couriers.module';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { UsersModule } from '@/modules/users/users.module';
import { AdminStaffController } from './controllers/admin-staff.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminStaffInvitesService } from './services/admin-staff-invites.service';
import { AdminStaffRolesService } from './services/admin-staff-roles.service';
import { AdminStaffUpdatesService } from './services/admin-staff-updates.service';
import { AdminUserCardService } from './services/admin-user-card.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [AssignmentModule, AuthModule, CouriersModule, MailModule, RealtimeModule, UsersModule],
  controllers: [AdminUsersController, AdminStaffController],
  providers: [
    AdminUsersService,
    AdminUserCardService,
    AdminStaffInvitesService,
    AdminStaffRolesService,
    AdminStaffUpdatesService,
  ],
})
export class AdminModule {}
