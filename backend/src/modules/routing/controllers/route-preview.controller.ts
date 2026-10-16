import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Public } from '../../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { ROUTE_PREVIEW_ROUTES } from '../constants/routing.constants';
import { type RoutePreviewDto, routePreviewSchema } from '../dto/route-preview.dto';
import { RoutePreviewThrottleGuard } from '../guards/route-preview-throttle.guard';
import { RoutePreviewService } from '../services/route-preview.service';
import type { RouteLines } from '../types/routing.types';

// The calculator of the landing, for a guest too, and the order form of a client. The global
// throttler is skipped: RoutePreviewThrottleGuard limits a guest and a user each by their own rate.
@Controller(ROUTE_PREVIEW_ROUTES.BASE)
export class RoutePreviewController {
  constructor(private readonly preview: RoutePreviewService) {}

  @Public()
  @SkipThrottle()
  @UseGuards(OptionalJwtAuthGuard, RoutePreviewThrottleGuard)
  @Post(ROUTE_PREVIEW_ROUTES.PREVIEW)
  @HttpCode(HttpStatus.OK)
  build(
    @Body(new ZodValidationPipe(routePreviewSchema)) dto: RoutePreviewDto,
  ): Promise<RouteLines> {
    return this.preview.preview(dto);
  }
}
