import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ROLE } from '../../../common/enums/role.enum';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth.types';
import { CourierProfilesService } from '../../couriers/services/courier-profiles.service';
import { COURIER_OFFERS_ROUTES } from '../constants/assignment.constants';
import { type OfferIdParamDto, offerIdParamSchema } from '../dto/offer-id-param.dto';
import { OfferResponsesService } from '../services/offer-responses.service';
import { OfferViewsService } from '../services/offer-views.service';
import type { CurrentOffer } from '../types/assignment.types';

@Controller(COURIER_OFFERS_ROUTES.BASE)
@Roles(ROLE.COURIER)
export class CourierOffersController {
  constructor(
    private readonly profiles: CourierProfilesService,
    private readonly views: OfferViewsService,
    private readonly responses: OfferResponsesService,
  ) {}

  @Get(COURIER_OFFERS_ROUTES.CURRENT)
  async current(@CurrentUser() user: AuthUser): Promise<CurrentOffer> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);

    return { offer: await this.views.findCurrent(courierProfileId) };
  }

  @Post(COURIER_OFFERS_ROUTES.ACCEPT)
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(offerIdParamSchema)) params: OfferIdParamDto,
  ): Promise<{ orderId: number }> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);

    return this.responses.accept(user.userId, courierProfileId, params.offerId);
  }

  @Post(COURIER_OFFERS_ROUTES.DECLINE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async decline(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(offerIdParamSchema)) params: OfferIdParamDto,
  ): Promise<void> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);

    await this.responses.decline(courierProfileId, params.offerId);
  }
}
