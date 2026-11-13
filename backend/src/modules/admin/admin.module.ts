import { Module } from '@nestjs/common';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminUserCardService } from './services/admin-user-card.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminUserCardService],
})
export class AdminModule {}
