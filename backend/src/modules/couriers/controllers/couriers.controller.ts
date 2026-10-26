import { Body, Controller, Get, Put } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { COURIERS_ROUTES } from '../constants/couriers.constants';
import {
  type UpdateAvailabilityDto,
  updateAvailabilitySchema,
} from '../dto/update-availability.dto';
import { type UpdateVehicleDto, updateVehicleSchema } from '../dto/update-vehicle.dto';
import { CourierAvailabilityService } from '../services/courier-availability.service';
import { CourierProfilesService } from '../services/courier-profiles.service';
import { CourierVehiclesService } from '../services/courier-vehicles.service';
import type { CourierMe, CourierVehicle } from '../types/couriers.types';

@Controller(COURIERS_ROUTES.BASE)
@Roles(ROLE.COURIER)
export class CouriersController {
  constructor(
    private readonly profiles: CourierProfilesService,
    private readonly vehicles: CourierVehiclesService,
    private readonly availability: CourierAvailabilityService,
  ) {}

  @Get(COURIERS_ROUTES.ME)
  getMe(@CurrentUser() user: AuthUser): Promise<CourierMe> {
    return this.profiles.getMe(user.userId);
  }

  @Put(COURIERS_ROUTES.VEHICLE)
  updateVehicle(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateVehicleSchema)) dto: UpdateVehicleDto,
  ): Promise<CourierVehicle> {
    return this.vehicles.update(user.userId, dto);
  }

  @Put(COURIERS_ROUTES.AVAILABILITY)
  updateAvailability(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateAvailabilitySchema)) dto: UpdateAvailabilityDto,
  ): Promise<CourierMe> {
    return this.availability.set(user.userId, dto.isAvailable);
  }
}
