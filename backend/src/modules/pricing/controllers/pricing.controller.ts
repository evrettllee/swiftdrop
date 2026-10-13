import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { type EstimatePriceDto, estimatePriceSchema } from '../dto/estimate-price.dto';
import { PRICING_ROUTES, PRICING_THROTTLE } from '../constants/pricing.constants';
import { PricingService } from '../services/pricing.service';
import type { PriceEstimate } from '../types/pricing.types';

@Controller(PRICING_ROUTES.BASE)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Public()
  @Throttle(PRICING_THROTTLE)
  @Post(PRICING_ROUTES.ESTIMATES)
  @HttpCode(HttpStatus.OK)
  estimate(
    @Body(new ZodValidationPipe(estimatePriceSchema)) dto: EstimatePriceDto,
  ): Promise<PriceEstimate> {
    return this.pricing.estimate(dto);
  }
}
