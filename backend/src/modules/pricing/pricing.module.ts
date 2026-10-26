import { Module } from '@nestjs/common';
import { OsrmModule } from '@/integrations/osrm/osrm.module';
import { ZonesModule } from '@/modules/zones/zones.module';
import { PricingController } from './controllers/pricing.controller';
import { PricingService } from './services/pricing.service';

@Module({
  imports: [ZonesModule, OsrmModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
