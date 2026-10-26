import { Controller, Get } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { COURIER_STATS_ROUTES } from '../constants/deliveries.constants';
import { CourierStatsService } from '../services/courier-stats.service';
import type { CourierTodayStats } from '../types/deliveries.types';

@Controller(COURIER_STATS_ROUTES.BASE)
@Roles(ROLE.COURIER)
export class CourierStatsController {
  constructor(
    private readonly profiles: CourierProfilesService,
    private readonly stats: CourierStatsService,
  ) {}

  @Get(COURIER_STATS_ROUTES.TODAY)
  async today(@CurrentUser() user: AuthUser): Promise<CourierTodayStats> {
    return this.stats.today(await this.profiles.getProfileId(user.userId));
  }
}
