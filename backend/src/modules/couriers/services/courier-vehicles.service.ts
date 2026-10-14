import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { withLockConflict } from '../../../common/database/lock-conflict';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { vehicles } from '../../../database/schema';
import { COURIERS_ERROR_MESSAGES } from '../constants/couriers.constants';
import type { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { toCourierVehicle } from '../mappers/courier-profile.mapper';
import type { CourierVehicle } from '../types/couriers.types';
import { CourierProfilesService } from './courier-profiles.service';

@Injectable()
export class CourierVehiclesService {
  private readonly logger = new Logger(CourierVehiclesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly profiles: CourierProfilesService,
  ) {}

  update(userId: number, dto: UpdateVehicleDto): Promise<CourierVehicle> {
    return withLockConflict(
      () => this.db.transaction((tx) => this.replaceVehicle(tx, userId, dto)),
      COURIERS_ERROR_MESSAGES.BUSY,
      () => this.logger.warn(`Courier profile of user ${userId} is busy, vehicle change refused`),
    );
  }

  // The profile row stays locked until the commit, so going on shift cannot slip in between the
  // checks and the change: the other request waits and then sees the new vehicle.
  private async replaceVehicle(
    tx: Transaction,
    userId: number,
    dto: UpdateVehicleDto,
  ): Promise<CourierVehicle> {
    const profile = await this.profiles.lockOwnProfile(tx, userId);

    if (profile.isAvailable) {
      throw new ConflictException(COURIERS_ERROR_MESSAGES.ON_SHIFT);
    }

    if ((await this.profiles.findActiveOrderId(profile.courierProfileId, tx)) !== null) {
      throw new ConflictException(COURIERS_ERROR_MESSAGES.ON_ORDER);
    }

    const [vehicle] = await tx
      .insert(vehicles)
      .values({ courierProfileId: profile.courierProfileId, ...dto })
      .onConflictDoUpdate({ target: vehicles.courierProfileId, set: { ...dto } })
      .returning({
        type: vehicles.type,
        brand: vehicles.brand,
        model: vehicles.model,
        licensePlate: vehicles.licensePlate,
      });

    this.logger.log(`Courier ${profile.courierProfileId} set vehicle ${dto.type}`);

    return toCourierVehicle(vehicle);
  }
}
