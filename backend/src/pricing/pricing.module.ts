import { Module } from '@nestjs/common';
import { OsrmModule } from '../integrations/osrm/osrm.module';
import { ZonesModule } from '../zones/zones.module';
import { PricingService } from './pricing.service';

@Module({
  imports: [ZonesModule, OsrmModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
