import { Controller, Get } from '@nestjs/common';
import { ROLE } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth.types';
import { CourierProfilesService } from '../../couriers/services/courier-profiles.service';
import { COURIER_OFFERS_ROUTES } from '../constants/assignment.constants';
import { OfferViewsService } from '../services/offer-views.service';
import type { CurrentOffer } from '../types/assignment.types';

@Controller(COURIER_OFFERS_ROUTES.BASE)
@Roles(ROLE.COURIER)
export class CourierOffersController {
  constructor(
    private readonly profiles: CourierProfilesService,
    private readonly views: OfferViewsService,
  ) {}

  @Get(COURIER_OFFERS_ROUTES.CURRENT)
  async current(@CurrentUser() user: AuthUser): Promise<CurrentOffer> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);

    return { offer: await this.views.findCurrent(courierProfileId) };
  }
}
