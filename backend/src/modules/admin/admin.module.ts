import { Module } from '@nestjs/common';
import { MailModule } from '@/integrations/mail/mail.module';
import { AssignmentModule } from '@/modules/assignment/assignment.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { CouriersModule } from '@/modules/couriers/couriers.module';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { UsersModule } from '@/modules/users/users.module';
import { AdminAccessController } from './controllers/admin-access.controller';
import { AdminStaffController } from './controllers/admin-staff.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminAccessEffectsService } from './services/admin-access-effects.service';
import { AdminLinkMailService } from './services/admin-link-mail.service';
import { AdminPasswordResetService } from './services/admin-password-reset.service';
import { AdminStaffInvitesService } from './services/admin-staff-invites.service';
import { AdminStaffRolesService } from './services/admin-staff-roles.service';
import { AdminStaffUpdatesService } from './services/admin-staff-updates.service';
import { AdminUserAccessService } from './services/admin-user-access.service';
import { AdminUserCardService } from './services/admin-user-card.service';
import { AdminUserDeleteService } from './services/admin-user-delete.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [AssignmentModule, AuthModule, CouriersModule, MailModule, RealtimeModule, UsersModule],
  controllers: [AdminUsersController, AdminStaffController, AdminAccessController],
  providers: [
    AdminAccessEffectsService,
    AdminLinkMailService,
    AdminPasswordResetService,
    AdminStaffInvitesService,
    AdminStaffRolesService,
    AdminStaffUpdatesService,
    AdminUserAccessService,
    AdminUserCardService,
    AdminUserDeleteService,
    AdminUsersService,
  ],
})
export class AdminModule {}
