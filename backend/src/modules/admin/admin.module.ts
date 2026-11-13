import { Module } from '@nestjs/common';
import { MailModule } from '@/integrations/mail/mail.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { AdminStaffController } from './controllers/admin-staff.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminStaffInvitesService } from './services/admin-staff-invites.service';
import { AdminStaffUpdatesService } from './services/admin-staff-updates.service';
import { AdminUserCardService } from './services/admin-user-card.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [AuthModule, MailModule, UsersModule],
  controllers: [AdminUsersController, AdminStaffController],
  providers: [
    AdminUsersService,
    AdminUserCardService,
    AdminStaffInvitesService,
    AdminStaffUpdatesService,
  ],
})
export class AdminModule {}
